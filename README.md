# Minute Cryptic

A small birthday cryptic-crossword game. You do **not** need to be a developer to update it. All of the puzzle text lives in one file: `clues.json`.

**Important:** this site loads `clues.json` from the internet (or from a local server). Double-clicking `index.html` in a folder will **not** work. Use the steps below.

---

## 1. How to test locally

1. Open **Terminal** on your Mac.
2. Type `cd ` (with a space after cd), then drag this project folder into the Terminal window and press Return.
3. Run this command:

```
python3 -m http.server
```

4. In your browser, open: [http://localhost:8000](http://localhost:8000)
5. When you are done, go back to Terminal and press `Control + C` to stop the server.

If the page says “Couldn't load the clues, check clues.json”, the JSON file has a typo (see section 2).

---

## 2. How to add a new clue

You only change `clues.json`. Copy one existing clue object, paste it **before** the closing `]` of the `"clues"` array, and edit the text.

**Watch the commas.** Every clue except the last one must end with a comma. Every `"key": "value"` line inside an object except the last one must end with a comma too. A missing comma or a missing quote will break the whole game.

Put the photo in the `images` folder, then point `"image"` at it with a relative path like `images/my-photo.png`.

Copy-paste example (add this as a new item in the `"clues"` list):

```json
{
  "clue": "Your full cryptic clue here (5)",
  "answer": "HELLO",
  "hints": {
    "definition": {
      "highlight": "exact words from the clue",
      "text": "Our definition here is …"
    },
    "indicator": {
      "highlight": "rearranged",
      "text": "Our indicator here is …"
    },
    "fodder": {
      "highlight": ["word one", "word two"],
      "text": "Our fodder here is …"
    }
  },
  "reveal": {
    "image": "images/hello.png",
    "writeup": "Why this word matters to you.\nYou can use a new line."
  }
}
```

Notes:

- `"highlight"` can be one string, or a list of strings if the words are not next to each other in the clue.
- The highlight text must appear in the clue (capital letters do not matter).
- `"answer"` can be one word, several words (`ICE CREAM`), or hyphenated (`ICE-CREAM`). The boxes, gaps, and dashes are built automatically.
- Do **not** change `index.html` or `script.js` just to add a clue. The game counts however many objects are in `"clues"`.

After you save, refresh the browser. If the error message appears, undo your last edit and check quotes and commas.

---

## 3. How to edit existing clues, hints, or writeups

1. Open `clues.json` in any text editor.
2. Find the clue you want (search for a word from the clue or the answer).
3. Change the text in quotes:
   - `"clue"` — the puzzle text
   - `"answer"` — the solution (spaces and hyphens are allowed)
   - `"hints"` → `"definition"` / `"indicator"` / `"fodder"` → `"highlight"` and `"text"`
   - `"reveal"` → `"writeup"` for the personal note, `"image"` for the photo path
4. The birthday last screen is under `"finale"`: `"heading"`, `"message"`, `"image"`, and `"banner"` (the letter boxes, e.g. `HAPPY BIRTHDAY`).
5. `"title"` is the browser tab name. `"author"` is the small byline on the clue card.
6. Save the file and refresh the local site (section 1).

Line breaks in a writeup: put `\n` where you want a new line, or keep the text on several lines inside the quotes (JSON does not allow a raw Return inside quotes unless you use `\n`).

---

## 4. How to put it on GitHub Pages (using only the website)

No command line needed for this part.

1. Go to [https://github.com](https://github.com) and sign in (create a free account if you need one).
2. Click the **+** in the top right → **New repository**.
3. Name it something like `minute-cryptic`. Leave it **Public**. Do **not** tick “Add a README”. Click **Create repository**.
4. On the empty repo page, click **uploading an existing file**.
5. Drag these into the browser (not the `design` folder unless you want those screenshots public too):
   - `index.html`
   - `style.css`
   - `script.js`
   - `clues.json`
   - `README.md`
   - the `images` folder (drag the folder so the photos stay inside `images/`)
6. Click **Commit changes**.
7. Open the repo’s **Settings** tab → **Pages** (left sidebar).
8. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
9. Set the branch to **main** (or **master**) and the folder to **/ (root)**. Click **Save**.
10. Wait a minute, then refresh the Pages settings. GitHub will show a URL like `https://your-username.github.io/minute-cryptic/`.
11. Open that URL to play. Send him that link.

If a photo is missing after upload, check that the path in `clues.json` matches the file name exactly, including `.png` vs `.jpg`.

---

## 5. How to reset your own progress before he plays

The game remembers where you stopped (which clue, hints, and whether you were on the reveal or the birthday screen).

To wipe that and start at clue 1, open the site with `?reset=true` on the end of the address. Examples:

- Local: `http://localhost:8000/?reset=true`
- Online: `https://your-username.github.io/minute-cryptic/?reset=true`

The extra bit disappears from the address bar right away. There is no reset button on the page on purpose.

**Play Again** on the last screen also asks for confirmation, then starts over.

---

## 6. How to resize images (keep them a few hundred KB)

Large phone photos will make the site slow. Shrink them before you upload.

**On a Mac, using Preview:**

1. Open the photo in **Preview**.
2. Choose **Tools → Adjust Size…**
3. Set the width to about **800 pixels** (height will follow).
4. Click **OK**.
5. Choose **File → Export…**, pick JPEG or PNG, and use a quality that keeps the file around **200–400 KB**.
6. Save it into the `images` folder using the name you put in `clues.json`.

You can check the file size in Finder: click the file and press `Command + I`.
