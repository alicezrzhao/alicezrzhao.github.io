(function () {
  'use strict';

  var GITHUB_ICON =
    '<svg viewBox="0 0 496 512" aria-hidden="true" focusable="false"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z"/></svg>';

  function humanize(value) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return String(value);
  }

  async function fetchJson(url) {
    var response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Metric request failed: ' + response.status);
    }
    return response.json();
  }

  async function fetchGitHubStars(repositoryId) {
    try {
      var repository = await fetchJson('https://api.github.com/repos/' + repositoryId);
      if (Number.isSafeInteger(repository.stargazers_count)) {
        return repository.stargazers_count;
      }
    } catch (error) {
      // Fall through to Shields when GitHub's anonymous API quota is exhausted.
    }

    var shield = await fetchJson('https://img.shields.io/github/stars/' + repositoryId + '.json');
    var compactValue = String(shield.value || shield.message || '').trim();
    var match = compactValue.match(/^([\d.]+)([kKmM]?)$/);
    if (!match) {
      throw new Error('GitHub star count is missing.');
    }

    var multiplier = match[2].toLowerCase() === 'm' ? 1000000 :
      match[2].toLowerCase() === 'k' ? 1000 : 1;
    return Math.round(Number(match[1]) * multiplier);
  }

  function updateMetric(metric, value) {
    if (!Number.isSafeInteger(value) || value < 0) {
      return;
    }
    var valueElement = metric.querySelector('.paper-metric-value');
    if (!valueElement) {
      return;
    }
    var exactValue = value.toLocaleString('en-US') + ' GitHub stars';
    valueElement.textContent = humanize(value);
    metric.setAttribute('aria-label', exactValue);
    metric.title = exactValue;
    metric.hidden = false;
  }

  function init() {
    var metrics = document.querySelectorAll('.paper-metric-github[data-github-repo]');
    Array.prototype.forEach.call(metrics, function (metric) {
      if (!metric.querySelector('svg')) {
        metric.insertAdjacentHTML('afterbegin', GITHUB_ICON);
      }
      fetchGitHubStars(metric.getAttribute('data-github-repo')).then(function (value) {
        updateMetric(metric, value);
      }).catch(function () {
        // Leave this metric hidden if its public API is unavailable.
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
