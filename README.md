# Roadrunner Reading Calendar

A dependency-free calendar builder in English, Spanish, and Simplified Chinese.

Run `python3 -m http.server 8000 --bind 0.0.0.0` from this directory, then open the app in your browser. Choose a month and year (1900–2100); weekdays, month lengths, and leap years update automatically.

Two live design proposals are available:
- **Original layout:** preserves the title, Sunday-first grid, right-hand reading goals, and bottom name fields; stacks all three languages.
- **More room for languages:** moves goals beneath the grid into three grade-group columns and gives the calendar the full page width.

Add a note for one day or choose a start and end day for a multi-day event. Multi-day events appear as one horizontal arrow banner across their dates; ranges that cross a calendar row continue in a new banner on the next row. Enter the note in English, Spanish, or Simplified Chinese and leave the other fields blank; the app fills them when you leave the field. Common school phrases use a built-in phrasebook. Other text uses the browser's on-device Translator API when available; unsupported browsers ask the user to enter the remaining translations. Existing text is never overwritten, and translations should be reviewed before distribution.

Notes are stored separately for each month and year; school holidays are not inferred. Reading goals are editable. Settings save locally in the current browser. Use **Print / Save PDF** for a landscape calendar; choose landscape in your print dialog if your browser ignores the page setting.

Use **Upload school mascot** to choose a PNG, JPEG or WebP up to 2 MB. The original image appears on both sides of the heading immediately for review. Adjust its size with the slider; its proportions are preserved. **Mirror the right mascot** is enabled by default and can be switched off. Confirm to save the image and size in this browser, or cancel to restore the previously confirmed mascot. You can adjust or remove it later. Images stay in the browser and are not uploaded to a server.

Run the date-placement tests with `node --test calendar.test.mjs`. There are no third-party dependencies, build steps, external services, or credentials.
