from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer
from .serializers import (
    RegisterSerializer, UserSerializer,
    QuizListSerializer, QuizDetailSerializer, QuizCreateSerializer,
    AttemptSerializer, AttemptDetailSerializer, SubmitAnswerSerializer
)
from .ai_service import generate_quiz_questions


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ── Quiz CRUD ─────────────────────────────────────────────────────────────────

class QuizListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all quizzes created by the current user."""
        quizzes = Quiz.objects.filter(user=request.user)
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new quiz by generating AI questions."""
        serializer = QuizCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        topic = serializer.validated_data['topic']
        num_questions = serializer.validated_data['num_questions']
        difficulty = serializer.validated_data['difficulty']

        # Generate a title from the topic
        title = f"{topic.title()} Quiz"

        # Call AI service
        try:
            questions_data = generate_quiz_questions(topic, num_questions, difficulty)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate questions: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if len(questions_data) < 1:
            return Response(
                {'error': 'AI failed to generate valid questions. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Create quiz in database
        quiz = Quiz.objects.create(
            user=request.user,
            title=title,
            topic=topic,
            difficulty=difficulty,
            num_questions=len(questions_data),
        )

        # Create questions and choices
        for i, q_data in enumerate(questions_data):
            question = Question.objects.create(
                quiz=quiz,
                text=q_data['text'],
                explanation=q_data.get('explanation', ''),
                order=i + 1,
            )
            for j, c_data in enumerate(q_data['choices']):
                Choice.objects.create(
                    question=question,
                    text=c_data['text'],
                    is_correct=c_data['is_correct'],
                    order=j,
                )

        return Response(QuizListSerializer(quiz).data, status=status.HTTP_201_CREATED)


class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, quiz_id, user):
        try:
            return Quiz.objects.get(id=quiz_id, user=user)
        except Quiz.DoesNotExist:
            return None

    def get(self, request, quiz_id):
        quiz = self.get_object(quiz_id, request.user)
        if not quiz:
            return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = QuizDetailSerializer(quiz)
        return Response(serializer.data)

    def delete(self, request, quiz_id):
        quiz = self.get_object(quiz_id, request.user)
        if not quiz:
            return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Attempts ─────────────────────────────────────────────────────────────────

class StartAttemptView(APIView):
    """Start a new attempt at a quiz (or resume an incomplete one)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id, user=request.user)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check for an existing incomplete attempt
        existing = QuizAttempt.objects.filter(
            user=request.user, quiz=quiz, completed=False
        ).first()

        if existing:
            return Response(AttemptSerializer(existing).data)

        # Create a fresh attempt
        attempt = QuizAttempt.objects.create(user=request.user, quiz=quiz)
        return Response(AttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    """Submit an answer for one question in an attempt."""
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.completed:
            return Response({'error': 'This attempt is already completed.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question_id = serializer.validated_data['question_id']
        choice_id = serializer.validated_data['choice_id']

        # Validate question belongs to this quiz
        try:
            question = Question.objects.get(id=question_id, quiz=attempt.quiz)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found in this quiz.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate choice belongs to this question
        try:
            choice = Choice.objects.get(id=choice_id, question=question)
        except Choice.DoesNotExist:
            return Response({'error': 'Choice not found for this question.'}, status=status.HTTP_404_NOT_FOUND)

        # Create or update the answer (allow changing answer before finalizing)
        answer, created = UserAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={'selected_choice': choice}
        )

        # Advance progress tracker
        questions = list(attempt.quiz.questions.values_list('id', flat=True))
        try:
            q_index = questions.index(question_id)
            attempt.current_question_index = max(attempt.current_question_index, q_index + 1)
            attempt.save()
        except ValueError:
            pass

        return Response({
            'is_correct': choice.is_correct,
            'correct_choice_id': question.choices.get(is_correct=True).id,
            'current_question_index': attempt.current_question_index,
        })


class CompleteAttemptView(APIView):
    """Mark an attempt as complete and return the final score."""
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        if attempt.completed:
            return Response(AttemptDetailSerializer(attempt).data)

        attempt.completed = True
        attempt.completed_at = timezone.now()
        attempt.save()

        return Response(AttemptDetailSerializer(attempt).data)


class AttemptDetailView(APIView):
    """Get full details of a completed attempt for review."""
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AttemptDetailSerializer(attempt)
        return Response(serializer.data)


class AttemptListView(APIView):
    """List all attempts by the current user (quiz history)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(
            user=request.user, completed=True
        ).select_related('quiz')
        serializer = AttemptSerializer(attempts, many=True)
        return Response(serializer.data)


# ── Stats ─────────────────────────────────────────────────────────────────────

class UserStatsView(APIView):
    """Aggregate stats for the user's dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        total_quizzes = Quiz.objects.filter(user=user).count()
        completed_attempts = QuizAttempt.objects.filter(user=user, completed=True)
        total_attempts = completed_attempts.count()

        avg_score = 0
        best_score = 0
        if total_attempts > 0:
            scores = [a.score_percentage for a in completed_attempts]
            avg_score = round(sum(scores) / len(scores), 1)
            best_score = max(scores)

        # Recent activity (last 5 attempts)
        recent = completed_attempts[:5]

        return Response({
            'total_quizzes': total_quizzes,
            'total_attempts': total_attempts,
            'average_score': avg_score,
            'best_score': best_score,
            'recent_attempts': AttemptSerializer(recent, many=True).data,
        })
