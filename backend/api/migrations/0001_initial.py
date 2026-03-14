from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Quiz',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('topic', models.CharField(max_length=255)),
                ('difficulty', models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', max_length=10)),
                ('num_questions', models.IntegerField(default=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quizzes', to='auth.user')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField()),
                ('explanation', models.TextField(blank=True, null=True)),
                ('order', models.IntegerField(default=0)),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='api.quiz')),
            ],
            options={'ordering': ['order']},
        ),
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=500)),
                ('is_correct', models.BooleanField(default=False)),
                ('order', models.IntegerField(default=0)),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='choices', to='api.question')),
            ],
            options={'ordering': ['order']},
        ),
        migrations.CreateModel(
            name='QuizAttempt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('completed', models.BooleanField(default=False)),
                ('current_question_index', models.IntegerField(default=0)),
                ('quiz', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attempts', to='api.quiz')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attempts', to='auth.user')),
            ],
            options={'ordering': ['-started_at']},
        ),
        migrations.CreateModel(
            name='UserAnswer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('answered_at', models.DateTimeField(auto_now_add=True)),
                ('attempt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers', to='api.quizattempt')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_answers', to='api.question')),
                ('selected_choice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_answers', to='api.choice')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='useranswer',
            unique_together={('attempt', 'question')},
        ),
    ]
