# Roadrunner Reading Calendar

A dependency-free calendar builder in English, Spanish, and Simplified Chinese.

Run `python3 -m http.server 8000 --bind 0.0.0.0` from this directory, then open the app in your browser. Choose a month and year (1900–2100); weekdays, month lengths, and leap years update automatically.

Two live design proposals are available:
- **Original layout:** preserves the title, Sunday-first grid, right-hand reading goals, and bottom name fields; stacks all three languages.
- **More room for languages:** moves goals beneath the grid into three grade-group columns and gives the calendar the full page width.

Add or update notes by entering their day and translations. Notes are stored separately for each month and year; school holidays are not inferred. Reading goals are editable. Settings save locally in the current browser. Use **Print / Save PDF** for a landscape calendar; choose landscape in your print dialog if your browser ignores the page setting. Bird emoji are placeholders for school-provided mascot artwork. Chinese translations should receive school review before distribution.

Run the date-placement tests with `node --test calendar.test.mjs`. There are no third-party dependencies, build steps, external services, or credentials.
