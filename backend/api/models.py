from django.db import models
from django.contrib.auth.models import User


class Quiz(models.Model):
    """
    A quiz created by a user on a given topic.
    Stores the configuration and generated questions.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    num_questions = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def attempt_count(self):
        return self.attempts.count()

    @property
    def best_score(self):
        attempts = self.attempts.filter(user=self.user, completed=True)
        if not attempts.exists():
            return None
        return max(a.score_percentage for a in attempts)


class Question(models.Model):
    """
    A multiple-choice question belonging to a quiz.
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    explanation = models.TextField(blank=True, null=True)  # AI can provide explanation for correct answer
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.text[:60]}..."


class Choice(models.Model):
    """
    One of four answer choices for a question.
    Exactly one choice per question should be correct.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)  # A, B, C, D

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{'✓' if self.is_correct else '✗'} {self.text[:40]}"


class QuizAttempt(models.Model):
    """
    Records a single attempt by a user at a quiz.
    Tracks progress (current question) and completion.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    current_question_index = models.IntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} → {self.quiz.title} ({'done' if self.completed else 'in progress'})"

    @property
    def score(self):
        """Count of correct answers submitted."""
        return self.answers.filter(selected_choice__is_correct=True).count()

    @property
    def total_questions(self):
        return self.quiz.questions.count()

    @property
    def score_percentage(self):
        total = self.total_questions
        if total == 0:
            return 0
        return round((self.score / total) * 100, 1)

    @property
    def time_taken_seconds(self):
        if self.completed_at and self.started_at:
            return int((self.completed_at - self.started_at).total_seconds())
        return None


class UserAnswer(models.Model):
    """
    Records which choice a user selected for a question in an attempt.
    One row per question per attempt.
    """
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='user_answers')
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, related_name='user_answers')
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A user can only answer each question once per attempt
        unique_together = ['attempt', 'question']

    def __str__(self):
        correct = self.selected_choice.is_correct
        return f"{'✓' if correct else '✗'} {self.question.text[:40]}"
