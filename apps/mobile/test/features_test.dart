import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:learnova/models/models.dart';
import 'package:learnova/screens/quiz_screen.dart';

void main() {
  // No network in tests; fall back to the default font.
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  group('API parsing', () {
    test('LessonExtras reads summary and skips malformed quiz questions', () {
      final extras = LessonExtras.fromJson({
        'aiSummary': 'Short summary',
        'quiz': {
          'questions': [
            {'id': 'q1', 'question': 'Q?', 'options': ['a', 'b'], 'answerIndex': 1, 'explanation': 'because'},
            {'id': 'q2', 'options': ['x']}, // no question text
          ],
        },
      });
      expect(extras.aiSummary, 'Short summary');
      expect(extras.quiz, hasLength(1));
      expect(extras.quiz.first.answerIndex, 1);
    });

    test('LessonExtras treats blank summary and missing quiz as absent', () {
      final extras = LessonExtras.fromJson({'aiSummary': '  ', 'quiz': null});
      expect(extras.aiSummary, isNull);
      expect(extras.quiz, isEmpty);
    });

    test('Review and Purchase unwrap the joined row shape', () {
      final review = Review.fromJson({
        'review': {'id': 'r1', 'userId': 'u1', 'rating': 4, 'createdAt': '2026-01-02T00:00:00.000Z'},
        'user': {'id': 'u1', 'name': 'Sam'},
      });
      expect(review.userName, 'Sam');
      expect(review.rating, 4);

      final purchase = Purchase.fromJson({
        'purchase': {'type': 'subscription', 'amountCents': 1900, 'currency': 'usd', 'status': 'succeeded'},
        'course': null,
      });
      expect(purchase.title, 'Learnova Pro');
      expect(purchase.amountLabel, r'$19.00');
    });

    test('Subscription is active only for active status', () {
      expect(Subscription.fromJson({'status': 'active'}).isActive, isTrue);
      expect(Subscription.fromJson({'status': 'canceled'}).isActive, isFalse);
    });
  });

  testWidgets('Quiz counts correct answers and shows the score', (tester) async {
    final questions = [
      QuizQuestion(question: 'One?', options: ['right', 'wrong'], answerIndex: 0, explanation: 'e1'),
      QuizQuestion(question: 'Two?', options: ['wrong', 'right'], answerIndex: 1),
    ];
    await tester.pumpWidget(MaterialApp(home: QuizScreen(lessonTitle: 'Lesson', questions: questions)));

    await tester.tap(find.text('right'));
    await tester.pump();
    expect(find.text('Correct'), findsOneWidget);
    expect(find.text('e1'), findsOneWidget);
    await tester.tap(find.text('Next question'));
    await tester.pump();

    await tester.tap(find.text('wrong'));
    await tester.pump();
    expect(find.text('Not quite'), findsOneWidget);
    await tester.tap(find.text('See my score'));
    await tester.pump();

    expect(find.text('1/2'), findsOneWidget);
    expect(find.text('Worth another look'), findsOneWidget);
  });
}
