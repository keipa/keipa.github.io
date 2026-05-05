var canvasDots = function () {
  var canvas = document.getElementById('particles-canvas'),
    ctx = canvas.getContext('2d'),
    colorDot = 'rgba(88, 166, 255, 0.3)',
    color = 'rgba(88, 166, 255, 0.1)';

  // Expose a method to update particle colors for theme switching
  canvasDots.updateColors = function (dot, line) {
    colorDot = dot;
    color = line;
  };
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  ctx.fillStyle = colorDot;
  ctx.lineWidth = .1;
  ctx.strokeStyle = color;

  var mousePosition = {
    x: 30 * canvas.width / 100,
    y: 30 * canvas.height / 100
  };

  var dots = {
    nb: 350,
    distance: 60,
    d_radius: 100,
    array: []
  };

  function Dot() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;

    this.vx = -.5 + Math.random();
    this.vy = -.5 + Math.random();

    this.radius = Math.random();
  }

  Dot.prototype = {
    create: function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fill();
    },

    animate: function () {
      for (i = 0; i < dots.nb; i++) {

        var dot = dots.array[i];

        if (dot.y < 0 || dot.y > canvas.height) {
          dot.vx = dot.vx;
          dot.vy = - dot.vy;
        }
        else if (dot.x < 0 || dot.x > canvas.width) {
          dot.vx = - dot.vx;
          dot.vy = dot.vy;
        }
        dot.x += dot.vx;
        dot.y += dot.vy;
      }
    },

    line: function () {
      for (i = 0; i < dots.nb; i++) {
        for (j = 0; j < dots.nb; j++) {
          i_dot = dots.array[i];
          j_dot = dots.array[j];

          if ((i_dot.x - j_dot.x) < dots.distance && (i_dot.y - j_dot.y) < dots.distance && (i_dot.x - j_dot.x) > - dots.distance && (i_dot.y - j_dot.y) > - dots.distance) {
            if ((i_dot.x - mousePosition.x) < dots.d_radius && (i_dot.y - mousePosition.y) < dots.d_radius && (i_dot.x - mousePosition.x) > - dots.d_radius && (i_dot.y - mousePosition.y) > - dots.d_radius) {
              ctx.beginPath();
              ctx.moveTo(i_dot.x, i_dot.y);
              ctx.lineTo(j_dot.x, j_dot.y);
              ctx.stroke();
              ctx.closePath();
            }
          }
        }
      }
    }
  };

  function createDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorDot;
    ctx.strokeStyle = color;
    for (i = 0; i < dots.nb; i++) {
      dots.array.push(new Dot());
      dot = dots.array[i];

      dot.create();
    }

    dot.line();
    dot.animate();
  }

  window.onmousemove = function (parameter) {
    mousePosition.x = parameter.pageX;
    mousePosition.y = parameter.pageY;
  }

  mousePosition.x = window.innerWidth / 2;
  mousePosition.y = window.innerHeight / 2;

  setInterval(createDots, 1000 / 30);
};



function calcPaths(totalDur) {
  // unset 'animated' class to body which will reset the animation
  document.body.classList.remove('animated');

  // get all SVG elements - lines and dots
  const paths = document.querySelectorAll('.autograph__path');
  // prepare path length variable
  let len = 0;
  // prepare animation delay length variable
  let delay = 0;

  // escape if no elements found
  if (!paths.length) {
    return false;
  }

  // set duration in seconds of animation to default if not set
  const totalDuration = totalDur || 0.5;

  // calculate the full path length
  paths.forEach(path => {
    const totalLen = path.getTotalLength();
    len += totalLen;
  });

  paths.forEach(path => {
    const pathElem = path;
    // get current path length
    const totalLen = path.getTotalLength();
    // calculate current animation duration
    const duration = totalLen / len * totalDuration;

    // set animation duration and delay
    pathElem.style.animationDuration = `${duration < 0.2 ? 0.2 : duration}s`;
    pathElem.style.animationDelay = `${delay}s`;

    // set dash array and offset to path length - this is how you hide the line
    pathElem.setAttribute('stroke-dasharray', totalLen);
    pathElem.setAttribute('stroke-dashoffset', totalLen);

    // set delay for the next path - added .2 seconds to make it more realistic
    delay += duration + 0.2;
  });

  // set 'animated' class to body which will start the animation
  document.body.classList.add('animated');

  return true;
}

calcPaths();


window.addEventListener('load', function () {
  canvasDots();

  // Update copyright year
  const yearSpan = document.getElementById('copyright-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});


// Theme toggle
(function () {
  var toggle = document.getElementById('theme-toggle');
  var root = document.documentElement;
  var stored = localStorage.getItem('theme');
  var imageSection = document.querySelector('.image-section');
  var manVideo = document.getElementById('theme-video-man');
  var reverseVideo = document.getElementById('theme-video-reverse');
  var transitionToken = 0;
  var transitionFadeMs = 240;
  var settleTimerId = null;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#f5f0eb' : '#010409');
    }
    if (canvasDots.updateColors) {
      if (theme === 'light') {
        canvasDots.updateColors('rgba(47, 109, 186, 0.25)', 'rgba(47, 109, 186, 0.08)');
      } else {
        canvasDots.updateColors('rgba(88, 166, 255, 0.3)', 'rgba(88, 166, 255, 0.1)');
      }
    }
  }

  function hasThemeVideos() {
    return !!(imageSection && manVideo && reverseVideo);
  }

  function videoNameForTheme(theme) {
    return theme === 'light' ? 'reverse' : 'man';
  }

  function videoNameForTransition(currentTheme) {
    return currentTheme === 'dark' ? 'man' : 'reverse';
  }

  function getVideoByName(name) {
    return name === 'man' ? manVideo : reverseVideo;
  }

  function clearSettleTimer() {
    if (settleTimerId !== null) {
      clearTimeout(settleTimerId);
      settleTimerId = null;
    }
  }

  function waitForFrame(video) {
    return new Promise(function (resolve) {
      if (video.readyState >= 2) {
        resolve();
        return;
      }

      var onReady = function () {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        resolve();
      };

      var onError = function () {
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        console.error('Failed to load theme video frame:', video.currentSrc || video.src);
        resolve();
      };

      video.addEventListener('loadeddata', onReady);
      video.addEventListener('error', onError);
    });
  }

  function ensureFirstFrame(video) {
    if (video.readyState > 0) {
      video.currentTime = 0;
      return Promise.resolve();
    }

    video.load();
    return waitForFrame(video).then(function () {
      if (video.readyState > 0) {
        video.currentTime = 0;
      }
    });
  }

  function clearPlaybackState(video) {
    video.pause();
    video.classList.remove('is-playing', 'is-fading-out', 'is-on-top');
  }

  function hideVideo(video) {
    clearPlaybackState(video);
    video.classList.remove('is-visible');
    if (video.readyState > 0) {
      video.currentTime = 0;
    }
  }

  function showLayeredVideos(topVideoName, bottomVideoName) {
    var topVideo = getVideoByName(topVideoName);
    var bottomVideo = getVideoByName(bottomVideoName);

    [manVideo, reverseVideo].forEach(function (video) {
      video.classList.remove('is-playing', 'is-fading-out');
      video.classList.toggle('is-visible', video === topVideo || video === bottomVideo);
      video.classList.toggle('is-on-top', video === topVideo);
    });
  }

  function setRestingTheme(theme) {
    if (!hasThemeVideos()) {
      return;
    }

    clearSettleTimer();
    var visibleName = videoNameForTheme(theme);
    var visibleVideo = getVideoByName(visibleName);
    var hiddenVideo = visibleVideo === manVideo ? reverseVideo : manVideo;

    hideVideo(hiddenVideo);
    clearPlaybackState(visibleVideo);
    visibleVideo.classList.add('is-visible');
    imageSection.setAttribute('data-media-state', 'resting-' + theme);
    imageSection.setAttribute('data-transition-video', visibleName);
    imageSection.setAttribute('data-next-video', '');

    if (visibleVideo.readyState > 0) {
      visibleVideo.currentTime = 0;
      return;
    }

    visibleVideo.load();
    waitForFrame(visibleVideo).then(function () {
      if (visibleVideo.readyState > 0) {
        visibleVideo.currentTime = 0;
      }
    });
  }

  function initializeThemeVideos(theme) {
    if (!hasThemeVideos()) {
      return;
    }

    [manVideo, reverseVideo].forEach(function (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.controls = false;
      video.playsInline = true;
      video.classList.remove('is-visible', 'is-playing', 'is-fading-out', 'is-on-top');
    });

    setRestingTheme(theme);

    [manVideo, reverseVideo].forEach(function (video) {
      ensureFirstFrame(video);
    });
  }

  function bindTransitionEnd(video, handler) {
    if (video._themeTransitionEndHandler) {
      video.removeEventListener('ended', video._themeTransitionEndHandler);
    }

    video._themeTransitionEndHandler = handler;
    video.addEventListener('ended', handler, { once: true });
  }

  function playThemeTransition(currentTheme, nextTheme) {
    if (!hasThemeVideos()) {
      return;
    }

    transitionToken += 1;
    var token = transitionToken;
    clearSettleTimer();
    var transitionVideoName = videoNameForTransition(currentTheme);
    var targetVideoName = videoNameForTheme(nextTheme);
    var transitionVideo = getVideoByName(transitionVideoName);
    var targetVideo = getVideoByName(targetVideoName);

    [manVideo, reverseVideo].forEach(function (video) {
      if (video._themeTransitionEndHandler) {
        video.removeEventListener('ended', video._themeTransitionEndHandler);
        video._themeTransitionEndHandler = null;
      }
      video.classList.remove('is-playing', 'is-fading-out', 'is-on-top');
    });

    imageSection.setAttribute('data-media-state', 'transitioning-' + currentTheme + '-to-' + nextTheme);
    imageSection.setAttribute('data-transition-video', transitionVideoName);
    imageSection.setAttribute('data-next-video', targetVideoName);
    imageSection.setAttribute('data-last-transition-video', transitionVideoName);

    var settleToRestingFrame = function () {
      if (token !== transitionToken) {
        return;
      }

      if (transitionVideo._themeTransitionEndHandler) {
        transitionVideo.removeEventListener('ended', transitionVideo._themeTransitionEndHandler);
        transitionVideo._themeTransitionEndHandler = null;
      }

      transitionVideo.classList.remove('is-playing');
      transitionVideo.classList.add('is-fading-out');

      settleTimerId = setTimeout(function () {
        if (token !== transitionToken) {
          return;
        }
        setRestingTheme(nextTheme);
      }, transitionFadeMs);
    };

    Promise.all([
      ensureFirstFrame(transitionVideo),
      ensureFirstFrame(targetVideo)
    ]).then(function () {
      if (token !== transitionToken) {
        return;
      }

      showLayeredVideos(transitionVideoName, targetVideoName);
      transitionVideo.classList.add('is-playing');
      bindTransitionEnd(transitionVideo, settleToRestingFrame);

      var playPromise = transitionVideo.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(function (error) {
          if (token !== transitionToken) {
            return;
          }
          console.error('Theme transition video playback failed:', error);
          settleToRestingFrame();
        });
      }
    });
  }

  var initialTheme = stored === 'light' ? 'light' : 'dark';
  applyTheme(initialTheme);
  initializeThemeVideos(initialTheme);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';

      applyTheme(next);
      localStorage.setItem('theme', next);
      playThemeTransition(current, next);
    });
  }
})();

// Card flip
var cardFlip = document.querySelector('.card-flip');
if (cardFlip) {
  document.querySelectorAll('.flip-corner').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      cardFlip.classList.toggle('flipped');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      cardFlip.classList.remove('flipped');
    }
  });
}
