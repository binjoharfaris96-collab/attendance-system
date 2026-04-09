import styles from "./top-weather-card.module.css";

type DayPhase = "morning" | "afternoon" | "evening" | "night";

function getDayPhase(): DayPhase {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Riyadh",
    }).format(new Date()),
  );

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

export function TopWeatherCard() {
  const dayPhase = getDayPhase();
  const dayPhaseClass = styles[dayPhase];

  return (
    <div className={`${styles.cardm} ${dayPhaseClass}`} aria-label="Weather widget">
      <div className={styles.card}>
        <div className={styles.weather}>&#9728;</div>
        <div className={styles.main}>31&deg;C</div>
        <div className={styles.mainsub}>Clear</div>
      </div>

      <div className={styles.card2}>
        <div className={styles.expandContent}>
          <div className={styles.metricGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Humidity</span>
              <span className={styles.metricValue}>42%</span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Air</span>
              <span className={styles.metricValue}>Good</span>
            </div>
          </div>

          <div className={styles.lower}>
            <span className={styles.aqi}>AQI 41</span>
            <span className={styles.realfeel}>Feels 34&deg;</span>
          </div>

          <div className={styles.windtext}>Wind 12</div>
        </div>

        <div className={styles.card3}>Riyadh</div>
      </div>
    </div>
  );
}
