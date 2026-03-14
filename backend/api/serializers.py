from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']


# ── Quiz ──────────────────────────────────────────────────────────────────────

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'order']
        # NOTE: is_correct is intentionally excluded here to prevent cheating
        # It's only included in the review serializer after completion


class ChoiceWithAnswerSerializer(serializers.ModelSerializer):
    """Used after quiz completion to reveal correct answers."""
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices', 'order']


class QuestionReviewSerializer(serializers.ModelSerializer):
    """Includes correct answers and explanation for post-quiz review."""
    choices = ChoiceWithAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'explanation', 'choices', 'order']


class QuizListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    question_count = serializers.ReadOnlyField()
    attempt_count = serializers.ReadOnlyField()
    best_score = serializers.ReadOnlyField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'topic', 'difficulty', 'num_questions',
            'question_count', 'attempt_count', 'best_score', 'created_at'
        ]


class QuizDetailSerializer(serializers.ModelSerializer):
    """Full quiz with questions, used when taking a quiz."""
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.ReadOnlyField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'topic', 'difficulty', 'num_questions',
            'questions', 'question_count', 'created_at'
        ]


class QuizCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['topic', 'num_questions', 'difficulty']

    def validate_num_questions(self, value):
        if not (5 <= value <= 20):
            raise serializers.ValidationError('Number of questions must be between 5 and 20.')
        return value


# ── Attempts ─────────────────────────────────────────────────────────────────

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_text = serializers.CharField(source='selected_choice.text', read_only=True)
    is_correct = serializers.BooleanField(source='selected_choice.is_correct', read_only=True)

    class Meta:
        model = UserAnswer
        fields = ['id', 'question', 'question_text', 'selected_choice', 'selected_text', 'is_correct']


class AttemptSerializer(serializers.ModelSerializer):
    score = serializers.ReadOnlyField()
    total_questions = serializers.ReadOnlyField()
    score_percentage = serializers.ReadOnlyField()
    time_taken_seconds = serializers.ReadOnlyField()
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'quiz_topic', 'quiz_difficulty',
            'started_at', 'completed_at', 'completed',
            'current_question_index', 'score', 'total_questions',
            'score_percentage', 'time_taken_seconds'
        ]


class AttemptDetailSerializer(AttemptSerializer):
    """Attempt with full answer review, used after completion."""
    answers = UserAnswerSerializer(many=True, read_only=True)
    questions_review = serializers.SerializerMethodField()

    class Meta(AttemptSerializer.Meta):
        fields = AttemptSerializer.Meta.fields + ['answers', 'questions_review']

    def get_questions_review(self, obj):
        questions = obj.quiz.questions.all()
        return QuestionReviewSerializer(questions, many=True).data


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField()
