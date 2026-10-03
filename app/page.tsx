import Link from "next/link";

import QuickStart from "@/app/components/portal/QuickStart";
import RewardCounter from "@/app/components/portal/RewardCounter";
import RoomStatus from "@/app/components/portal/RoomStatus";
import { APPS, FLOORS } from "@/app/lib/apps";

import styles from "./portal.module.css";

export default function PortalPage() {
  return (
    <main className={styles.portal}>
      <header className={styles.header}>
        <div className={styles.gate}>
          <span className={styles.torch} aria-hidden="true">
            🔥
          </span>
          <h1 className={styles.logo}>
            <span className={styles.logoJa}>ことばダンジョン</span>
            <span className={styles.logoEn}>KOTOBA DUNGEON</span>
          </h1>
          <span className={styles.torch} aria-hidden="true">
            🔥
          </span>
        </div>
        <p className={styles.tagline}>えいごの ことばを あつめる ぼうけん</p>
        <RewardCounter />
      </header>

      <QuickStart />

      {FLOORS.map((floor) => {
        const rooms = APPS.filter((app) => app.floor === floor.id);
        return (
          <section key={floor.id} className={styles.floor} aria-labelledby={`floor-${floor.id}`}>
            <div className={styles.floorHeader}>
              <span className={styles.floorBadge}>{floor.badge}</span>
              <div>
                <h2 id={`floor-${floor.id}`} className={styles.floorName}>
                  {floor.name}
                </h2>
                <p className={styles.floorDesc}>{floor.desc}</p>
              </div>
            </div>

            <div className={styles.grid}>
              {rooms.map((app) => (
                <Link
                  key={app.id}
                  href={app.href}
                  className={styles.card}
                  style={{ "--card-accent": app.accent } as React.CSSProperties}
                >
                  <span className={styles.cardIcon} aria-hidden="true">
                    {app.icon}
                  </span>
                  <span className={styles.cardTitle}>{app.title}</span>
                  <span className={styles.cardDesc}>{app.desc}</span>
                  <span className={styles.cardTags}>
                    {app.tags.map((tag) => (
                      <span key={tag} className={styles.cardTag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                  <RoomStatus appId={app.id} />
                  <span className={styles.cardArrow} aria-hidden="true">
                    ▶
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <footer className={styles.footer}>(c) 2026 Yasuhiro Ohnaka - All rights reserved</footer>
    </main>
  );
}
