import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { Button } from "../ui/Button";
import { StartScreen } from "./StartScreen";

const CREDITS_DATA: { section: string; lines: string[] }[] = [
  {
    section: "Milestone 1",
    lines: [
      "Bodybuilder: Josiah Matthew",
      "Bateau: Sofia Guzeva",
      "Ananas: Jeffry Surianto",
    ],
  },
  {
    section: "Milestone 2",
    lines: [
      "Fond avec phare: Lucie Weis",
      "Kouign Amann: Président",
      "Jill Valentine: Capcom",
    ],
  },
  {
    section: "Milestone 3",
    lines: ["Chat: Bacon Bacon", "Diablo: Blizzard Entertainment"],
  },
  {
    section: "Milestone 4",
    lines: ["Course: FOM / Liberty Media", "Vélo: Doc du sport"],
  },
  { section: "Milestone 5", lines: ["Nadine de Rotchild: David Atlan"] },
  { section: "Milestone 6", lines: ["Pokemon: Nintendo"] },
  {
    section: "Milestone 7",
    lines: ["Picsou: The Walt Disney Company", "Villa: Engel & Völkers"],
  },
  { section: "Milestone 8", lines: ["Monopoly: Hasbro, Inc."] },
  {
    section: "Milestone 9",
    lines: ["Orange: Pixabay", "Bras: Khavazh Shervashidze"],
  },
  {
    section: "Milestone 10",
    lines: [
      "Montagne: Kristian Aleksandrov",
      "Luge: Snow Leader",
      "Fraise: Ylanite Koppens",
    ],
  },
  { section: "Milestone 11", lines: ["Café: WEbjay"] },
  { section: "Milestone 12", lines: ["Chaton: Emrah Turudu", "Mars: NASA"] },
  { section: "Milestone 13", lines: ["ackboo: ackboo"] },
  {
    section: "Milestone 14",
    lines: [
      "Chaton: Emrah Turudu",
      "Banane: Deon Black",
      "Chocolatine: Bridor",
      "Roulé au jambon: Marmiton",
      "Ciel étoilé: Björn Landersheim",
    ],
  },
  {
    section: "Milestone 15",
    lines: ["Vélo: powergym", "Camion: Havvanur", "Chiot: Jatin Verma"],
  },
  {
    section: "Milestone 16",
    lines: [
      "Petit chat: Alex Ravvas",
      "Banane: Felix Rosa",
      "Fraise: Mustafa Akin",
      "Doom: Screenshot by Kierbalowsky, Doom property of Microsoft",
    ],
  },
  { section: "Milestone 17", lines: ["Photo: Sơn Ngọc", "Negi: Larisa P."] },
  {
    section: "Milestone 18",
    lines: [
      "Fond marin: Dajana Reçi",
      "Pelleteuse: Gaspar Zaldo",
      "Poisson bleu: Nanda Putra",
    ],
  },
  { section: "Milestone 19", lines: ["Photo principale: fentonroma143"] },
  {
    section: "Milestone 20",
    lines: [
      "Photo principale: Biolane",
      "Canard: Schnabels",
      "Chaton Mouillé: Felikat",
    ],
  },
];

export class CreditsScreen extends Container {
  public static assetBundles = ["main"];

  private content: Container;
  private contentMask: Graphics;
  private backButton: Button;
  private title: Text;
  private scrollHitArea: Graphics;
  private scrollY = 0;
  private maxScrollY = 0;
  private contentTop = 100;
  private contentAvailH = 0;
  private contentHeight = 0;

  constructor() {
    super();

    this.title = new Text({
      text: "Crédits",
      style: {
        fontSize: 48,
        fill: 0xffffff,
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      anchor: { x: 0.5, y: 0 },
    });
    this.addChild(this.title);

    this.content = new Container();
    this.addChild(this.content);

    this.contentMask = new Graphics();
    this.content.mask = this.contentMask;
    this.addChild(this.contentMask);

    // Full-screen hit area for scroll
    this.scrollHitArea = new Graphics();
    this.scrollHitArea.alpha = 0;
    this.scrollHitArea.eventMode = "static";
    this.addChild(this.scrollHitArea);

    this.eventMode = "static";
    this.interactiveChildren = true;
    this.on("wheel", (e: WheelEvent) => {
      this.scrollY = Math.max(
        0,
        Math.min(this.maxScrollY, this.scrollY + e.deltaY) + 50,
      );
      this.content.y = this.contentTop - this.scrollY;
    });

    this.backButton = new Button({
      text: "Retour",
      width: 200,
      height: 70,
      fontSize: 22,
    });
    this.backButton.onPress.connect(() => {
      void engine().navigation.showScreen(StartScreen);
    });
    this.addChild(this.backButton);

    this.buildCredits();
  }

  private buildCredits(): void {
    let yOffset = 0;

    for (const entry of CREDITS_DATA) {
      if (entry.lines.length === 0 && entry.section === "Bromance 2") continue;

      const sectionTitle = new Text({
        text: entry.section,
        style: {
          fontSize: 26,
          fill: 0xec1561,
          fontFamily: "monospace",
          fontWeight: "bold",
          align: "center",
        },
        anchor: { x: 0.5, y: 0 },
      });
      sectionTitle.y = yOffset;
      this.content.addChild(sectionTitle);
      yOffset += 36;

      for (const line of entry.lines) {
        const lineText = new Text({
          text: line,
          style: {
            fontSize: 20,
            fill: 0xffffff,
            fontFamily: "monospace",
            align: "center",
          },
          anchor: { x: 0.5, y: 0 },
        });
        lineText.y = yOffset;
        this.content.addChild(lineText);
        yOffset += 28;
      }

      yOffset += 16;
    }

    this.contentHeight = yOffset;
  }

  public resize(width: number, height: number): void {
    this.title.x = width * 0.5;
    this.title.y = 24;

    this.contentTop = 100;
    this.contentAvailH = height - 180;
    this.content.x = width * 0.5;
    this.content.y = this.contentTop - this.scrollY;

    this.contentMask.clear();
    this.contentMask.rect(0, this.contentTop, width, this.contentAvailH);
    this.contentMask.fill(0xffffff);

    this.maxScrollY = Math.max(0, this.contentHeight - this.contentAvailH);
    this.scrollY = Math.min(this.scrollY, this.maxScrollY);

    // Hit area covers the full screen for scroll events
    this.scrollHitArea.clear();
    this.scrollHitArea.rect(0, 0, width, height);
    this.scrollHitArea.fill({ color: 0x000000, alpha: 0.001 });

    this.backButton.x = width * 0.5;
    this.backButton.y = height - 60;
  }
}
