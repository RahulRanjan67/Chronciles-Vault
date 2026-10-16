/**
 * DEVELOPMENT-ONLY demo data for the Private Vault.
 *
 * Loaded exclusively through dynamic imports guarded by `import.meta.env.DEV`,
 * so production builds tree-shake this module away. Every entry is fictional,
 * paraphrased planning metadata. Nothing here is explicit; the rating tags
 * (R18, forbidden romance, and so on) only label the kind of notes a vault
 * would hold.
 */

export const DEMO_VAULT_PASSPHRASE = "blossom-demo-2026";

export interface DemoVaultNote {
  readonly title: string;
  readonly body: string;
}

export const DEMO_VAULT_NOTES: readonly DemoVaultNote[] = [
  {
    title: "[R18 · Forbidden Romance] Oath Beneath the Plum Blossoms",
    body:
      "Outline & intimate drafts. A court archivist and a disciplined sword heir are bound by an ancient betrothal neither can acknowledge before the sect elders. Intense emotional and physical tension behind closed palace doors.",
  },
  {
    title: "[Forbidden Romance · Taboo Cultivation] Master-Disciple Moonlit Dao",
    body:
      "Dual cultivation techniques strictly prohibited by the Jade Mountain Precepts. Notes on Chapter 82: The disciple shields the Master through the heavenly lightning tribulation, leading to an undeniable confession under the peach blossoms.",
  },
  {
    title: "[R18 · Demonic Sect] The Righteous Saint & Demonic Empress",
    body:
      "Hidden side story translation. He was sent to purify her demonic core, but ended up bound to her demonic throne. Contains uncensored dialogue drafts and passionate vows in the crimson pavilion.",
  },
  {
    title: "[Forbidden Romance · Secret Diary] Royal Archivist & The Cursed Consort",
    body:
      "Confidential reading diary: The imperial archives at midnight. Every glance exchanged during scroll translation carries capital punishment under royal decree. Forbidden touch, lingering silk robes, and unspoken devotion.",
  },
  {
    title: "[R18 · Secret Scenario] The Unrecorded 1864th Regression Night",
    body:
      "ORV private fanfic scenario & chapter concept: Beyond the Final Wall, when the stars go dim and only two remain in the subway car. Raw personal reflections on Dokja & Joonghyuk's eternal bond.",
  },
  {
    title: "[Forbidden Romance] Two Sects, One Lantern",
    body:
      "Disciples from rival sects meet on the mountain bridge each full moon. Sect law forbids any bond between them. Planned reveal: chapter 14, after the lantern festival.",
  },
  {
    title: "[Enemies to Lovers · Tension] Silk and Steel Draft",
    body:
      "An imperial censor and a wandering swordswoman trade barbs and blades across three provinces. High heat tension, unyielding pride, and late-night wound tending by the campfire.",
  },
  {
    title: "[Spoiler · Major] Lotus Oath Ending",
    body:
      "The oath was forged by the heroine's teacher to shield the bloodline. Do not reveal before volume 3 or the twist loses its weight.",
  },
  {
    title: "[Lore] Blossom Dynasty Calendar & Secret Archives",
    body:
      "Thirteen moons per year. Plum season opens the Cloud Court tournament. Lotus season seals the Vault edicts. Ink-moon nights are when forbidden sect scrolls are copied.",
  },
  {
    title: "Private reflection: favourite midnight chapter",
    body:
      "The quiet confession scene on the bridge is the reason I keep rereading this series. Revisit before updating progress.",
  },
];
