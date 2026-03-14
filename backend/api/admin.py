from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt, UserAnswer


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'topic', 'difficulty', 'num_questions', 'created_at']
    list_filter = ['difficulty', 'created_at']
    search_fields = ['title', 'topic', 'user__username']
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'quiz', 'order']
    inlines = [ChoiceInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'completed', 'score_percentage', 'started_at']
    list_filter = ['completed']


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_choice']
