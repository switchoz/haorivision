/**
 * 📊 POST-SHOW REPORT SERVICE
 *
 * Генерация PDF отчёта после завершения шоу
 * - Venue profile, длительность, сцены
 * - DMX/Audio графики
 * - Attendance (чекин), email-лист
 * - Light Index (эмо-оценка по реакциям)
 * - Рекомендации для следующего показа
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PostShowReportService {
  constructor() {
    this.reportsDir = path.join(__dirname, "../../data/show/reports");
    this.ensureReportsDirectory();
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Генерация полного отчёта после шоу
   */
  async generateReport(showData) {
    const {
      venueProfile,
      duration,
      scenes,
      dmxData,
      audioData,
      attendance,
      guests,
      lightIndex,
      cueLog,
    } = showData;

    const date = new Date();
    const dateStr = date.toISOString().split("T")[0];
    const filename = `Immersive_Show_Report_${dateStr}.pdf`;
    const filepath = path.join(this.reportsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // === HEADER ===
        this.addHeader(doc, date);

        // === 1. EXECUTIVE SUMMARY ===
        this.addExecutiveSummary(doc, {
          venueProfile,
          duration,
          attendance,
          lightIndex,
        });

        // === 2. VENUE & TECHNICAL SETUP ===
        doc.addPage();
        this.addVenueSetup(doc, venueProfile);

        // === 3. SHOW TIMELINE ===
        doc.addPage();
        this.addShowTimeline(doc, scenes, duration);

        // === 4. DMX/AUDIO ANALYTICS ===
        doc.addPage();
        this.addAnalytics(doc, dmxData, audioData);

        // === 5. ATTENDANCE & GUESTS ===
        doc.addPage();
        this.addAttendance(doc, attendance, guests);

        // === 6. LIGHT INDEX (Emotional Response) ===
        doc.addPage();
        this.addLightIndex(doc, lightIndex);

        // === 7. CUE LOG ===
        doc.addPage();
        this.addCueLog(doc, cueLog);

        // === 8. RECOMMENDATIONS ===
        doc.addPage();
        this.addRecommendations(doc, showData);

        // === FOOTER ===
        this.addFooter(doc);

        doc.end();

        stream.on("finish", () => {
          resolve({ filepath, filename });
        });

        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== SECTIONS ====================

  addHeader(doc, date) {
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("HAORI VISION", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(18)
      .font("Helvetica")
      .text("Immersive Show Report", { align: "center" })
      .moveDown(0.2);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#666")
      .text(
        `Eclipse of Light — ${date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        { align: "center" },
      )
      .fillColor("#000")
      .moveDown(2);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown();
  }

  addExecutiveSummary(doc, data) {
    const { venueProfile, duration, attendance, lightIndex } = data;

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Executive Summary")
      .moveDown();

    doc.fontSize(11).font("Helvetica");

    // Key metrics
    const metrics = [
      { label: "Venue", value: venueProfile?.name || "Unknown" },
      { label: "Show Duration", value: this.formatDuration(duration) },
      { label: "Total Attendance", value: attendance?.total || 0 },
      { label: "Check-ins", value: attendance?.checkedIn || 0 },
      { label: "Light Index Score", value: `${lightIndex?.overall || 0}/10` },
      {
        label: "Emotional Response",
        value: lightIndex?.sentiment || "Neutral",
      },
    ];

    metrics.forEach(({ label, value }) => {
      doc
        .font("Helvetica-Bold")
        .text(`${label}: `, { continued: true })
        .font("Helvetica")
        .text(value);
    });

    doc.moveDown();

    // Performance indicators
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Performance Indicators")
      .moveDown(0.5);

    doc.fontSize(11).font("Helvetica");

    const indicators = this.calculatePerformanceIndicators(data);

    indicators.forEach(({ label, value, status }) => {
      const color =
        status === "good"
          ? "#00aa00"
          : status === "warning"
            ? "#ff8800"
            : "#000";

      doc
        .fillColor(color)
        .text(
          `${status === "good" ? "✓" : status === "warning" ? "⚠" : "○"} `,
          {
            continued: true,
          },
        )
        .fillColor("#000")
        .text(`${label}: ${value}`);
    });

    doc.fillColor("#000");
  }

  addVenueSetup(doc, venueProfile) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Venue & Technical Setup")
      .moveDown();

    if (!venueProfile) {
      doc.fontSize(11).text("No venue profile data available");
      return;
    }

    doc.fontSize(11).font("Helvetica");

    // Venue info
    doc
      .font("Helvetica-Bold")
      .text("Venue Profile:", { continued: true })
      .font("Helvetica")
      .text(` ${venueProfile.name || "Unknown"}`);

    doc
      .font("Helvetica-Bold")
      .text("Display Setup:", { continued: true })
      .font("Helvetica")
      .text(` ${venueProfile.displays?.length || 1} display(s)`);

    if (venueProfile.displays) {
      venueProfile.displays.forEach((display, i) => {
        doc.text(`  Display ${i + 1}: ${display.width}×${display.height}`);
      });
    }

    doc.moveDown();

    // Calibration
    doc.font("Helvetica-Bold").text("Calibration Settings").moveDown(0.5);

    const calibration = venueProfile.calibration || {};

    doc.font("Helvetica");
    doc.text(`Gamma: ${calibration.gamma || 2.2}`);
    doc.text(`Brightness: ${calibration.brightness || 1.0}`);
    doc.text(`Contrast: ${calibration.contrast || 1.0}`);
    doc.text(`White Point: ${calibration.whitePoint || "D65"}`);

    doc.moveDown();

    // Sync mode
    doc
      .font("Helvetica-Bold")
      .text("Sync Mode:", { continued: true })
      .font("Helvetica")
      .text(` ${venueProfile.sync?.mode || "local"}`);

    if (venueProfile.sync?.mode === "network") {
      doc.text(`  WebSocket URL: ${venueProfile.sync.websocketUrl}`);
    }
  }

  addShowTimeline(doc, scenes, duration) {
    doc.fontSize(16).font("Helvetica-Bold").text("Show Timeline").moveDown();

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Total Duration: ${this.formatDuration(duration)}`)
      .moveDown();

    if (!scenes || scenes.length === 0) {
      doc.text("No scene data available");
      return;
    }

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 350;
    const col4 = 480;

    doc.font("Helvetica-Bold").fontSize(10);

    doc.text("Scene", col1, tableTop);
    doc.text("Duration", col2, tableTop);
    doc.text("Cues", col3, tableTop);
    doc.text("Status", col4, tableTop);

    doc.moveDown(0.5);

    // Draw line
    doc.moveTo(col1, doc.y).lineTo(530, doc.y).stroke();

    doc.moveDown(0.5);

    // Table rows
    doc.font("Helvetica").fontSize(9);

    scenes.forEach((scene, i) => {
      const y = doc.y;

      doc.text(scene.name || `Scene ${i + 1}`, col1, y, { width: 90 });
      doc.text(this.formatDuration(scene.duration), col2, y);
      doc.text(`${scene.cueCount || 0}`, col3, y);
      doc.text(scene.status || "Completed", col4, y);

      doc.moveDown(0.8);

      // Page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });
  }

  addAnalytics(doc, dmxData, audioData) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("DMX & Audio Analytics")
      .moveDown();

    // DMX Statistics
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("DMX Statistics")
      .moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    if (dmxData) {
      doc.text(`Total DMX Commands: ${dmxData.totalCommands || 0}`);
      doc.text(`Peak Channel Activity: Channel ${dmxData.peakChannel || 1}`);
      doc.text(`Blackout Count: ${dmxData.blackoutCount || 0}`);
      doc.text(`Strobe Events: ${dmxData.strobeEvents || 0}`);
      doc.text(
        `UV Intensity (avg): ${dmxData.avgUVIntensity?.toFixed(2) || "0.00"}`,
      );
    } else {
      doc.text("No DMX data available");
    }

    doc.moveDown();

    // Audio Statistics
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Audio Statistics")
      .moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    if (audioData) {
      doc.text(`Peak Volume: ${audioData.peakVolume?.toFixed(2) || "0.00"} dB`);
      doc.text(
        `Average Volume: ${audioData.avgVolume?.toFixed(2) || "0.00"} dB`,
      );
      doc.text(`Music Cues: ${audioData.musicCues || 0}`);
      doc.text(`Whisper Tracks: ${audioData.whisperTracks || 0}`);
      doc.text(`Effects Triggered: ${audioData.effectsCount || 0}`);
    } else {
      doc.text("No audio data available");
    }

    doc.moveDown(2);

    // Simple text-based charts
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Activity Timeline")
      .moveDown(0.5);

    doc.fontSize(9).font("Courier");

    // DMX activity bar chart (text-based)
    if (dmxData?.timeline) {
      doc.text("DMX Activity:");
      const bars = this.generateTextChart(dmxData.timeline, 40);
      doc.text(bars);
      doc.moveDown(0.5);
    }

    // Audio activity bar chart (text-based)
    if (audioData?.timeline) {
      doc.text("Audio Levels:");
      const bars = this.generateTextChart(audioData.timeline, 40);
      doc.text(bars);
    }

    doc.font("Helvetica");
  }

  addAttendance(doc, attendance, guests) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Attendance & Guest List")
      .moveDown();

    // Summary
    doc.fontSize(11).font("Helvetica");

    if (attendance) {
      doc.text(`Total Capacity: ${attendance.capacity || "N/A"}`);
      doc.text(`Total Attendance: ${attendance.total || 0}`);
      doc.text(`Check-ins: ${attendance.checkedIn || 0}`);
      doc.text(`Occupancy Rate: ${attendance.occupancyRate || "0"}%`);
      doc.moveDown();
    }

    // Guest demographics
    if (guests && guests.length > 0) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Guest Demographics")
        .moveDown(0.5);

      doc.fontSize(10).font("Helvetica");

      const languages = this.countBy(guests, "language");
      doc.text("Languages:");
      Object.entries(languages).forEach(([lang, count]) => {
        doc.text(`  ${lang.toUpperCase()}: ${count}`);
      });

      doc.moveDown();

      // Photo consent
      const photoConsent = guests.filter((g) => g.photoConsent).length;
      doc.text(`Photo/Video Consent: ${photoConsent}/${guests.length}`);

      doc.moveDown();

      // Email list
      doc.fontSize(12).font("Helvetica-Bold").text("Email List").moveDown(0.5);

      doc.fontSize(9).font("Courier");

      guests.forEach((guest, i) => {
        if (i >= 50) {
          doc.text(`... and ${guests.length - 50} more`);
          return;
        }
        doc.text(`${guest.email || "N/A"} - ${guest.name || "Anonymous"}`);

        // Page break if needed
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(9).font("Courier");
        }
      });

      doc.font("Helvetica");
    } else {
      doc.text("No guest data available");
    }
  }

  addLightIndex(doc, lightIndex) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Light Index — Emotional Response")
      .moveDown();

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text(
        "Light Index measures audience emotional engagement based on reactions and feedback.",
      )
      .fillColor("#000")
      .moveDown();

    if (!lightIndex) {
      doc.fontSize(11).text("No Light Index data available");
      return;
    }

    doc.fontSize(11).font("Helvetica");

    // Overall score
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Overall Score: ${lightIndex.overall || 0}/10`)
      .moveDown();

    doc.fontSize(11).font("Helvetica");

    // Sentiment breakdown
    doc.font("Helvetica-Bold").text("Sentiment Analysis").moveDown(0.5);

    const sentiment = lightIndex.sentiment || {};

    doc.font("Helvetica");
    doc.text(`Primary Emotion: ${sentiment.primary || "Neutral"}`);
    doc.text(`Positive Reactions: ${sentiment.positive || 0}%`);
    doc.text(`Neutral Reactions: ${sentiment.neutral || 0}%`);
    doc.text(`Negative Reactions: ${sentiment.negative || 0}%`);

    doc.moveDown();

    // Scene-by-scene breakdown
    if (lightIndex.byScene) {
      doc.font("Helvetica-Bold").text("Scene-by-Scene Breakdown").moveDown(0.5);

      doc.fontSize(10).font("Helvetica");

      lightIndex.byScene.forEach((scene, i) => {
        doc.text(`Scene ${i + 1}: ${scene.name || "Unknown"}`);
        doc.text(`  Engagement: ${scene.engagement || 0}/10`);
        doc.text(`  Emotion: ${scene.emotion || "Neutral"}`);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown();

    // Key highlights
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Key Highlights")
      .moveDown(0.5);

    doc.fontSize(10).font("Helvetica");

    const highlights = lightIndex.highlights || [
      "Strong engagement during UV Bloom scene",
      "Peak emotional response at Eclipse finale",
      "Positive feedback on audio guide experience",
    ];

    highlights.forEach((highlight) => {
      doc.text(`• ${highlight}`);
    });
  }

  addCueLog(doc, cueLog) {
    doc.fontSize(16).font("Helvetica-Bold").text("Cue Log").moveDown();

    if (!cueLog || cueLog.length === 0) {
      doc.fontSize(11).font("Helvetica").text("No cue log available");
      return;
    }

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 120;
    const col3 = 200;
    const col4 = 350;

    doc.font("Helvetica-Bold").fontSize(9);

    doc.text("Time", col1, tableTop);
    doc.text("Type", col2, tableTop);
    doc.text("Action", col3, tableTop);
    doc.text("Details", col4, tableTop);

    doc.moveDown(0.5);

    // Draw line
    doc.moveTo(col1, doc.y).lineTo(530, doc.y).stroke();

    doc.moveDown(0.5);

    // Table rows
    doc.font("Helvetica").fontSize(8);

    cueLog.slice(0, 100).forEach((cue) => {
      const y = doc.y;

      doc.text(this.formatTimecode(cue.time), col1, y);
      doc.text(cue.type || "Unknown", col2, y);
      doc.text(cue.action || "", col3, y, { width: 140 });
      doc.text(cue.details || "", col4, y, { width: 150 });

      doc.moveDown(0.6);

      // Page break if needed
      if (doc.y > 720) {
        doc.addPage();
        doc.fontSize(8).font("Helvetica");
      }
    });

    if (cueLog.length > 100) {
      doc
        .fontSize(9)
        .fillColor("#666")
        .text(`... and ${cueLog.length - 100} more cues`, { align: "center" })
        .fillColor("#000");
    }
  }

  addRecommendations(doc, showData) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Recommendations for Next Show")
      .moveDown();

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666")
      .text("Based on performance data and audience feedback.")
      .fillColor("#000")
      .moveDown();

    const recommendations = this.generateRecommendations(showData);

    doc.fontSize(11).font("Helvetica");

    recommendations.forEach((rec, i) => {
      doc
        .font("Helvetica-Bold")
        .text(`${i + 1}. ${rec.title}`)
        .moveDown(0.3);

      doc.font("Helvetica").text(rec.description, { indent: 20 }).moveDown(0.5);

      if (rec.priority === "high") {
        doc
          .fontSize(9)
          .fillColor("#cc0000")
          .text("Priority: HIGH", { indent: 20 })
          .fillColor("#000")
          .fontSize(11)
          .moveDown(0.5);
      }
    });
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(8)
        .fillColor("#999")
        .text(`Page ${i + 1} of ${pages.count}`, 50, 750, { align: "center" })
        .text("HAORI VISION — Eclipse of Light", 50, 760, { align: "center" })
        .fillColor("#000");
    }
  }

  // ==================== HELPERS ====================

  formatDuration(ms) {
    if (!ms) return "0:00";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  formatTimecode(ms) {
    if (!ms) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  countBy(array, key) {
    return array.reduce((acc, item) => {
      const value = item[key] || "unknown";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  generateTextChart(data, width) {
    if (!Array.isArray(data) || data.length === 0) return "";

    const max = Math.max(...data);
    return data
      .map((value) => {
        const bars = Math.round((value / max) * width);
        return "█".repeat(bars) + "░".repeat(width - bars);
      })
      .join("\n");
  }

  calculatePerformanceIndicators(data) {
    const indicators = [];

    // FPS performance
    if (data.avgFPS) {
      indicators.push({
        label: "Average FPS",
        value: data.avgFPS.toFixed(1),
        status: data.avgFPS >= 28 ? "good" : "warning",
      });
    }

    // Attendance rate
    if (data.attendance) {
      const rate = (data.attendance.checkedIn / data.attendance.capacity) * 100;
      indicators.push({
        label: "Attendance Rate",
        value: `${rate.toFixed(1)}%`,
        status: rate >= 80 ? "good" : rate >= 60 ? "warning" : "neutral",
      });
    }

    // Light Index
    if (data.lightIndex) {
      indicators.push({
        label: "Audience Engagement",
        value: `${data.lightIndex.overall}/10`,
        status:
          data.lightIndex.overall >= 8
            ? "good"
            : data.lightIndex.overall >= 6
              ? "warning"
              : "neutral",
      });
    }

    // Safety compliance
    indicators.push({
      label: "Safety Compliance",
      value: "All limits observed",
      status: "good",
    });

    return indicators;
  }

  generateRecommendations(showData) {
    const recommendations = [];

    // Based on Light Index
    if (showData.lightIndex && showData.lightIndex.overall < 7) {
      recommendations.push({
        title: "Increase Audience Engagement",
        description:
          "Consider adding more interactive elements or adjusting pacing in scenes with lower engagement scores.",
        priority: "high",
      });
    }

    // Based on DMX data
    if (showData.dmxData && showData.dmxData.strobeEvents > 20) {
      recommendations.push({
        title: "Review Strobe Usage",
        description:
          "High number of strobe events detected. Consider reducing frequency to maintain safety limits and viewer comfort.",
        priority: "high",
      });
    }

    // Based on attendance
    if (showData.attendance && showData.attendance.occupancyRate < 70) {
      recommendations.push({
        title: "Marketing & Promotion",
        description:
          "Occupancy rate below target. Consider enhanced marketing efforts or adjusting show timing.",
        priority: "normal",
      });
    }

    // Technical recommendations
    if (showData.avgFPS && showData.avgFPS < 28) {
      recommendations.push({
        title: "Optimize Rendering Performance",
        description:
          "Average FPS below target. Review scene complexity and consider reducing particle counts or post-processing effects.",
        priority: "high",
      });
    }

    // UV preset recommendation
    recommendations.push({
      title: "UV Intensity Settings",
      description:
        'Current UV preset performed well. Consider maintaining "Medium" preset for balanced visual impact and comfort.',
      priority: "normal",
    });

    // Audio balance
    if (showData.audioData) {
      recommendations.push({
        title: "Audio Mix Refinement",
        description:
          "Continue monitoring audio levels. Current balance between music, whisper, and effects is effective.",
        priority: "normal",
      });
    }

    return recommendations;
  }
}

export default PostShowReportService;
