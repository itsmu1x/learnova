import 'package:flutter/material.dart';

import '../services/services.dart';

class AiTutorSheet extends StatefulWidget {
  const AiTutorSheet({super.key, required this.lessonId, required this.lessonTitle});
  final String lessonId;
  final String lessonTitle;

  @override
  State<AiTutorSheet> createState() => _AiTutorSheetState();
}

class _AiTutorSheetState extends State<AiTutorSheet> {
  final _ai = AiService();
  final _input = TextEditingController();
  final _messages = <_Msg>[];
  bool _loading = false;

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(_Msg(true, text));
      _input.clear();
      _loading = true;
    });
    try {
      final answer = await _ai.askTutor(
        text,
        lessonId: widget.lessonId,
        history: _messages
            .take(_messages.length - 1)
            .map((m) => {'role': m.isUser ? 'user' : 'assistant', 'content': m.text})
            .toList(),
      );
      setState(() => _messages.add(_Msg(false, answer)));
    } catch (e) {
      setState(() => _messages.add(_Msg(false, 'Error: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.smart_toy_outlined),
              title: const Text('AI Tutor'),
              subtitle: Text(widget.lessonTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ),
            const Divider(height: 1),
            Expanded(
              child: _messages.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text('Ask anything about this lesson.',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final m = _messages[i];
                        return Align(
                          alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.all(12),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            decoration: BoxDecoration(
                              color: m.isUser ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(
                              m.text,
                              style: TextStyle(color: m.isUser ? theme.colorScheme.onPrimary : null),
                            ),
                          ),
                        );
                      },
                    ),
            ),
            if (_loading) const LinearProgressIndicator(),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(hintText: 'Ask the AI tutor…'),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(onPressed: _loading ? null : _send, icon: const Icon(Icons.send)),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _Msg {
  _Msg(this.isUser, this.text);
  final bool isUser;
  final String text;
}
