import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../core/api_client.dart';
import '../core/theme.dart';

/// Mux HLS player with an explicit play affordance (no autoplay).
class MuxLessonPlayer extends StatefulWidget {
  const MuxLessonPlayer({
    super.key,
    required this.lessonId,
    this.title,
    this.thumbnailUrl,
  });

  final String? lessonId;
  final String? title;
  final String? thumbnailUrl;

  @override
  State<MuxLessonPlayer> createState() => _MuxLessonPlayerState();
}

class _MuxLessonPlayerState extends State<MuxLessonPlayer> {
  VideoPlayerController? _controller;
  String? _error;
  bool _loading = false;
  bool _started = false;
  bool _showControls = true;

  @override
  void didUpdateWidget(covariant MuxLessonPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lessonId != widget.lessonId) {
      _reset();
    }
  }

  Future<void> _reset() async {
    await _controller?.dispose();
    _controller = null;
    if (!mounted) return;
    setState(() {
      _error = null;
      _loading = false;
      _started = false;
      _showControls = true;
    });
  }

  Future<void> _startPlayback() async {
    final lessonId = widget.lessonId;
    if (lessonId == null || _loading) return;

    setState(() {
      _loading = true;
      _error = null;
      _started = true;
    });

    try {
      final data = await ApiClient.instance.get('/videos/$lessonId/playback') as Map<String, dynamic>;
      final playbackId = data['playbackId'] as String?;
      final token = data['token'] as String?;
      final devMode = data['devMode'] == true;

      if (playbackId == null || playbackId == 'dev-placeholder' || devMode) {
        setState(() {
          _loading = false;
          _error = 'Video isn’t ready for this lesson yet.';
        });
        return;
      }

      final uri = Uri.parse(
        token != null && token.isNotEmpty
            ? 'https://stream.mux.com/$playbackId.m3u8?token=$token'
            : 'https://stream.mux.com/$playbackId.m3u8',
      );

      final controller = VideoPlayerController.networkUrl(uri);
      await controller.initialize();
      controller.addListener(() {
        if (mounted) setState(() {});
      });
      await controller.play();
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Couldn’t load video. Check your connection and try again.';
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: ColoredBox(
          color: Colors.black,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (widget.lessonId == null) {
      return const _Message(icon: Icons.play_circle_outline, text: 'Select a lesson to start watching.');
    }

    if (_error != null) {
      return _Message(
        icon: Icons.error_outline,
        text: _error!,
        actionLabel: 'Retry',
        onAction: _startPlayback,
      );
    }

    if (!_started) {
      return _Poster(
        thumbnailUrl: widget.thumbnailUrl,
        title: widget.title,
        onPlay: _startPlayback,
      );
    }

    if (_loading || _controller == null || !_controller!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator(color: Colors.white70));
    }

    final controller = _controller!;
    return GestureDetector(
      onTap: () => setState(() => _showControls = !_showControls),
      child: Stack(
        fit: StackFit.expand,
        children: [
          FittedBox(
            fit: BoxFit.contain,
            child: SizedBox(
              width: controller.value.size.width,
              height: controller.value.size.height,
              child: VideoPlayer(controller),
            ),
          ),
          if (_showControls) ...[
            Container(color: Colors.black26),
            Center(
              child: IconButton(
                iconSize: 64,
                style: IconButton.styleFrom(backgroundColor: Colors.black45),
                onPressed: () {
                  setState(() {
                    if (controller.value.isPlaying) {
                      controller.pause();
                    } else {
                      controller.play();
                    }
                  });
                },
                icon: Icon(
                  controller.value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                  color: Colors.white,
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  VideoProgressIndicator(
                    controller,
                    allowScrubbing: true,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    colors: const VideoProgressColors(
                      playedColor: AppTheme.indigo,
                      bufferedColor: Colors.white24,
                      backgroundColor: Colors.white12,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                    child: Row(
                      children: [
                        Text(
                          _format(controller.value.position),
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                        const Text(' / ', style: TextStyle(color: Colors.white38, fontSize: 12)),
                        Text(
                          _format(controller.value.duration),
                          style: const TextStyle(color: Colors.white54, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _format(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    final h = d.inHours;
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }
}

class _Poster extends StatelessWidget {
  const _Poster({required this.onPlay, this.thumbnailUrl, this.title});

  final VoidCallback onPlay;
  final String? thumbnailUrl;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (thumbnailUrl != null)
          Image.network(thumbnailUrl!, fit: BoxFit.cover)
        else
          Container(decoration: const BoxDecoration(gradient: AppTheme.heroGradient)),
        Container(color: Colors.black45),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Material(
                color: Colors.white,
                shape: const CircleBorder(),
                elevation: 4,
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: onPlay,
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Icon(Icons.play_arrow_rounded, size: 40, color: AppTheme.indigo),
                  ),
                ),
              ),
              if (title != null) ...[
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    title!,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
              const SizedBox(height: 4),
              const Text('Tap to play', style: TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.text,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: Colors.white54),
          const SizedBox(height: 12),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}
