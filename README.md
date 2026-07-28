# OpenTutti

OpenTutti is a free, browser-based music education platform for students, teachers, and independent musicians. It brings together ear training, written theory, sight-reading, classroom practice, and staff-based composition tools in one clean web workspace.

Hyperlink: [OpenTutti](https://opentutti.org)
Link: https://opentutti.org

The platform is designed around practical musicianship: students should not only memorize theory, but also hear it, recognize it, write it, read it, and apply it in real musical contexts.

## Core Features

### Ear Training Gym

The Ear Training Gym helps students build aural fluency through structured listening drills.

Supported drill areas include:

- Pitch recognition
- Interval identification
- Chord recognition
- Scale recognition
- Cadence practice
- Clef-aware staff display
- Configurable playback styles
- Review and session summaries
- Trouble-area feedback and practice guidance

Students can practice with immediate feedback and use session review tools to understand what needs more work.

### Music Theory Tester

The Music Theory Tester provides written and staff-based theory practice with flexible settings.

Supported areas include:

- Note identification
- Interval identification
- Chord identification
- Scale identification
- Key signature identification
- Clef-aware question rendering
- Configurable answer formats
- Enharmonic answer handling where appropriate
- Session scoring and review

The theory tools are designed to connect notation, terminology, and musical reasoning instead of presenting isolated flashcards.

### Sight-reading Coach

The Sight-reading Coach generates short reading exercises for classroom projection, individual practice, or musicianship training.

Features include:

- Configurable clefs
- Key signature options
- Time signature options
- Adjustable measure count
- Automatic or custom pitch ranges
- Rhythm and pitch difficulty controls
- Optional rests and accidentals
- Starting pitch playback
- Full melody playback
- Revealable note names, solfege, and counts
- Reading tips and target areas

The coach is built for fast repeated practice, making it useful for singers, instrumentalists, theory classes, and ensemble warmups.

### OpenTuttiLab

OpenTuttiLab is a staff-based creative workspace for writing, editing, demonstrating, and playing short musical ideas directly in the browser.

Features include:

- Multi-staff score editing
- Blank score creation
- Starter templates
- Clef selection per staff
- Key signature controls
- Time signature controls
- Tempo control
- Multiple note durations
- Rests and accidentals
- Click-to-add note input
- Insert and erase editing modes
- Measure controls
- Selectable and draggable notes
- Triplet entry tools
- Per-staff instrument sounds
- Mute and solo controls
- Playback controls
- Playback scrubber
- Scrollable score workspace

OpenTuttiLab is intended for classroom demonstration, quick composition sketches, sight-reading examples, and staff-based experimentation.

### Student Workspace

The student workspace gives learners a central place to practice and complete assigned work.

Student-facing features include:

- Class joining
- Assignment access
- Practice sessions
- Assignment completion
- Score review
- Progress visibility
- Free practice access outside assignments

### Teacher Workspace

The teacher workspace supports lightweight class organization and practice assignment workflows.

Teacher-facing features include:

- Class creation
- Join code sharing
- Student roster viewing
- Assignment creation
- Exercise setting customization
- Completion tracking
- Score review
- Class discussion and assignment comments where enabled

The goal is to make music theory and ear training assignments easier to create, complete, and review without requiring heavy classroom software.

## Site Structure

```text
/
  Home page and feature overview

/about
  About OpenTutti and founder profile

/demo
  Embedded OpenTutti demonstration video

/practice/ear-training
  Ear Training Gym

/practice/theory
  Music Theory Tester

/practice/sight-reading
  Sight-reading Coach

/staff-lab
  OpenTuttiLab staff workspace

/login
  Log in page

/signup
  Account creation page

/student
  Student workspace

/teacher
  Teacher workspace

/student-guide
  Student guide

/teacher-guide
  Teacher guide

/privacy
  Privacy information
```

## Repository Structure

```text
app/
  about/
    page.tsx
  demo/
    page.tsx
  login/
    page.tsx
  practice/
    ear-training/
      page.tsx
    sight-reading/
      page.tsx
    theory/
      page.tsx
  privacy/
    page.tsx
  signup/
    page.tsx
  staff-lab/
    page.tsx
  student/
    page.tsx
  student-guide/
    page.tsx
  teacher/
    page.tsx
  teacher-guide/
    page.tsx
  page.tsx
  layout.tsx

components/
  EarTrainingGym.tsx
  FeatureCard.tsx
  SightReadingCoach.tsx
  SiteFooter.tsx
  SiteHeader.tsx
  StaffDisplay.tsx
  StaffTemplatePlayer.tsx
  TheoryTester.tsx

lib/
  music/
    earTraining.ts
    sightReading.ts
    staffTemplates.ts
    theoryTraining.ts
  siteConfig.ts

types/
  database.ts

public/
  OpenTutti static media, icons, images, and demo video
```

## Public Media

Static assets should be placed in the `public` directory.

Recommended layout:

```text
public/
  opentutti-logo.png
  IMG_E8066.JPG
  OpenTuttiDemoFinal.mp4
```

These files can then be referenced from the site as:

```text
/opentutti-logo.png
/IMG_E8066.JPG
/OpenTuttiDemoFinal.mp4
```

For a more organized production structure, images and videos may also be placed into subfolders:

```text
public/images/
public/videos/
```

## Navigation

The main header includes:

- About Us
- Demo
- Ear Training
- Music Theory
- Sight-reading
- OpenTuttiLab
- Guides dropdown
- Sign up
- Log In

The Guides dropdown contains:

- Student Guide
- Teacher Guide

The footer keeps the public site clean with essential support and policy links.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the site at:

```text
http://localhost:3000
```

Create a production build:

```bash
npm run build
```

Start the production build locally:

```bash
npm start
```

## Release Checklist

Before publishing, verify:

- The home page loads cleanly.
- The header links work on desktop and mobile widths.
- The Guides dropdown stays open while hovering into the dropdown card.
- The About Us image loads from the public folder.
- The Demo video loads from the public folder.
- Ear Training Gym generates and grades questions correctly.
- Music Theory Tester generates and grades questions correctly.
- Sight-reading Coach generates readable exercises.
- OpenTuttiLab loads a blank score and starter templates.
- OpenTuttiLab playback controls work.
- Sign up and Log In are separate pages.
- No visible placeholder, draft, beta, or unfinished language remains.
- No old branding remains in visible copy.

Useful search checks:

```powershell
Select-String -Path .\**\*.* -Pattern "Audvyn","OTLab","Sightreading","beta","draft","unfinished" -CaseSensitive:$false
```

Only intentional internal filenames or archived local files should appear. Public-facing code and copy should use:

```text
OpenTutti
OpenTuttiLab
Sight-reading
```

## Design Goals

OpenTutti is built around five principles:

1. **Practical musicianship** — connect what students see, hear, and perform.
2. **Fast classroom use** — keep tools simple enough for real teaching environments.
3. **Accessible practice** — make core theory and ear training available without expensive software.
4. **Immediate feedback** — help students learn from each question, not just receive a score.
5. **Integrated creativity** — support both structured drills and open-ended staff work.

## Technology

OpenTutti is built as a modern web application using:

- Next.js
- React
- TypeScript
- Tailwind CSS
- VexFlow
- Tone.js

These technologies support responsive pages, staff notation rendering, browser-based playback, and interactive music practice tools.

## License

Add a license file before public distribution. Common choices include:

- MIT License for permissive open-source distribution
- Apache 2.0 for permissive distribution with patent language
- All Rights Reserved if the project is not intended to be open source yet

## Project Status

OpenTutti is prepared as a public-facing music education platform with core practice, teaching, sight-reading, and staff-writing tools. Future development can expand notation editing, classroom analytics, export formats, mobile polish, accessibility, and additional musicianship exercises.