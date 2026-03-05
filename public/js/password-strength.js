// Minimal password strength evaluator and live UI updater
// Usage example (HTML):
// <input id="password" type="password" />
// <div id="password-strength">
//   <div id="password-strength-bar" style="height:8px;background:#eee;border-radius:4px"></div>
//   <div id="password-strength-text"></div>
// </div>

(function () {
    function evaluatePasswordStrength(password) {
        var length = password.length;
        var score = 0;
        var suggestions = [];

        if (length >= 12) {
            score += 2;
        } else if (length >= 8) {
            score += 1;
        }

        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('Add lowercase letters');
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('Add uppercase letters');
        }

        if (/[0-9]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('Add numbers');
        }

        if (/[^a-zA-Z0-9]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('Add symbols (e.g. !@#$%)');
        }

        if (length < 6) {
            score = Math.max(0, score - 1);
            suggestions.push('Make the password longer (at least 8 characters)');
        }

        var level = 'weak';
        if (score <= 2) level = 'weak';
        else if (score <= 4) level = 'medium';
        else level = 'strong';

        // normalize suggestions
        suggestions = Array.from(new Set(suggestions));

        return { password_length: length, score: score, level: level, suggestions: suggestions };
    }

    function updateUI(result) {
        var bar = document.getElementById('password-strength-bar');
        var text = document.getElementById('password-strength-text');
        if (!bar || !text) return;

        var pct = Math.min(100, (result.score / 6) * 100);
        bar.style.width = pct + '%';
        bar.style.transition = 'width 150ms ease';

        if (result.level === 'weak') {
            bar.style.background = '#e11d48'; // red
            text.textContent = 'Weak';
        } else if (result.level === 'medium') {
            bar.style.background = '#f59e0b'; // amber
            text.textContent = 'Medium';
        } else {
            bar.style.background = '#10b981'; // green
            text.textContent = 'Strong';
        }

        // Optionally show suggestions
        var suggEl = document.getElementById('password-strength-suggestions');
        if (suggEl) {
            suggEl.innerHTML = '';
            result.suggestions.forEach(function (s) {
                var li = document.createElement('div');
                li.textContent = '• ' + s;
                suggEl.appendChild(li);
            });
        }
    }

    // Attach to a password input with id 'password' by default
    function attach(inputId) {
        var input = document.getElementById(inputId || 'password');
        if (!input) return;

        input.addEventListener('input', function (e) {
            var val = e.target.value || '';
            var result = evaluatePasswordStrength(val);
            updateUI(result);

            // Optional: call server endpoint for central check (debounced)
            // Uncomment if you want to call the API you added at /api/password/strength
            // clearTimeout(input._pwTimer);
            // input._pwTimer = setTimeout(function(){
            //   fetch('/api/password/strength', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: val }) })
            //     .then(r=>r.json()).then(console.log).catch(()=>{});
            // }, 300);
        });
    }

    // Auto-attach on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () { attach('password'); });

    // expose
    window.PasswordStrength = { evaluate: evaluatePasswordStrength, attach: attach };
})();
