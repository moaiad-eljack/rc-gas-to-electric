# RC Gas to Electric

We're taking a nitro (gas) RC car and converting it to run electric. The engine comes out, a brushless motor, ESC and LiPo battery go in.

We're four first year engineering students at Columbia Basin College in Pasco, WA, two electrical and two mechanical. This repo is our engineering notebook for the project. We write it as we learn, so if something in here is wrong, it's because we were wrong at the time, and we'll fix it once we figure it out.

![Where we're at](images/roadmap.png)

## The team

| Name | Major | GitHub |
|---|---|---|
| Moaiad Eljack | Electrical Engineering | [@moaiad-eljack](https://github.com/moaiad-eljack) |
| Lily | Electrical Engineering | coming soon |
| Miguel | Mechanical Engineering | coming soon |
| Ayzln | Mechanical Engineering | coming soon |

The split works out pretty naturally. The EE side handles the motor, ESC, battery and wiring. The ME side handles mounting, gearing and everything that has to physically fit in the chassis.

## Phases

| Phase | Status |
|---|---|
| [0. Pre project](phase-0-pre-project/): learn how the electric side works before touching the car | Done |
| 1. Gas car teardown | Next meeting |
| 2. Parts planning | Not started |
| 3. The conversion | Not started |
| 4. Testing and tuning | Not started |

Each phase has its own folder with a README that explains what we did, what we learned, and what it leads into. Folders show up as we get to them.

## How this repo is laid out

```
phase-0-pre-project/   theory notes before we touch the car
  motors.md
  esc.md
  lipo-batteries.md
  wiring.md
  images/              our sketches
images/                repo level images (roadmap)
photos/                real photos of the team and the car
photo-credits.md       where the part photos come from
```

## How we work

- Notes go in after every meeting, not weeks later.
- We don't write ahead. The next meeting gets one line in the notes and that's it.
- If something we wrote turns out wrong, we fix it and say what changed in the commit.
- Part photos we didn't take ourselves come from Wikimedia Commons and get credited right under the photo. Full list in [photo-credits.md](photo-credits.md).

## Safety

LiPo batteries can catch fire if they're overcharged, over drained or damaged. Before anyone charges or plugs anything in, read [lipo-batteries.md](phase-0-pre-project/lipo-batteries.md).
