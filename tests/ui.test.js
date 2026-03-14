import { describe, it, expect, vi, beforeEach } from "vitest";
import { ui } from "../js/ui.js";
import { utils } from "../js/utils.js";

// Mock Lucide
vi.mock("lucide", () => ({
  createIcons: vi.fn(),
  Trash2: {},
  Pencil: {},
  AlertTriangle: {},
  BookOpen: {},
  GraduationCap: {},
  Plus: {},
  ArrowLeft: {},
  Moon: {},
  PlusCircle: {},
  Search: {},
  Settings: {},
  X: {},
  Check: {},
  CheckCircle: {},
  Info: {},
}));

describe("UI Layer (jsdom)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("showToast", () => {
    it("adds a toast element to the body", () => {
      ui.showToast("Test Message", "success");
      const toast = document.querySelector(".bg-green-500");
      expect(toast).not.toBeNull();
      expect(toast.textContent).toContain("Test Message");
    });

    it("escapes messages in the toast", () => {
      const dangerous = "<img src=x onerror=alert(1)>";
      ui.showToast(dangerous, "error");
      const toast = document.querySelector(".bg-red-500");
      expect(toast.innerHTML).not.toContain("<img src=x");
      expect(toast.textContent).toContain(dangerous);
    });
  });

  describe("confirmDialog", () => {
    it("creates an overlay and resolves on confirm", async () => {
      const promise = ui.confirmDialog("Are you sure?");
      const confirmBtn = document.getElementById("confirmBtn");
      expect(confirmBtn).not.toBeNull();

      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
      // Overlay should be removed after animation (or immediately in tests if we mock transition)
    });

    it("resolves to false on cancel", async () => {
      const promise = ui.confirmDialog("Are you sure?");
      const cancelBtn = document.getElementById("cancelBtn");
      cancelBtn.click();
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe("createStudentElement", () => {
    it("creates a student list item with correct data", () => {
      const student = {
        id: 123,
        name: "Mario Rossi",
        grades_count: 5,
        last_interrogation: "2026-03-01",
      };

      // Mocking app global if needed or just checking DOM
      const li = ui.createStudentElement(student, 14); // 14 days ago
      expect(li.tagName).toBe("LI");
      expect(li.textContent).toContain("Mario Rossi");
      expect(li.textContent).toContain("🎓 5");

      // Verify it uses textContent for name (security)
      const nameSpan = li.querySelector("span.font-medium");
      expect(nameSpan.textContent).toBe("Mario Rossi");
    });
  });

  describe("updateStats details", () => {
    it("handles all zero metrics", () => {
      document.body.innerHTML = `
                <div id="totalStudents"></div>
                <div id="alertCount"></div>
                <div id="subjectCount"></div>
                <div id="recentCount"></div>
                <div id="lastUpdate"></div>
            `;
      ui.updateStats([]);
      expect(document.getElementById("totalStudents").textContent).toBe("0");
      expect(document.getElementById("alertCount").textContent).toBe("0");
    });

    it("identifies urgent students (> 14 days)", () => {
      document.body.innerHTML = '<div id="alertCount"></div>';
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 15);
      ui.updateStats([{ last_interrogation: oldDate.toISOString() }]);
      expect(document.getElementById("alertCount").textContent).toBe("1");
    });
  });

  describe("render more complex cases", () => {
    it("does not re-animate if already rendered", () => {
      document.body.innerHTML =
        '<div id="subjectsContainer"><div>Existing</div></div><div id="emptyState" class="hidden"></div>';
      ui.render([{ id: 1, name: "A", subject: "S" }], { S: "#ff0000" }, "");
      const card = document.querySelector(".fade-in");
      expect(card).toBeNull();
    });

    it("renders skeletons correctly", () => {
      document.body.innerHTML = '<div id="subjectsContainer"></div>';
      ui.renderSkeletons([{ name: "Math" }], { Math: 2 });
      const container = document.getElementById("subjectsContainer");
      expect(container.innerHTML).toContain("skeleton");
    });
  });

  describe("safeColor", () => {
    it("returns default color for invalid hex", () => {
      document.body.innerHTML =
        '<div id="subjectsContainer"></div><div id="emptyState" class="hidden"></div>';
      ui.render([{ id: 1, name: "A", subject: "S" }], { S: "invalid" }, "");
      const title = document.querySelector("h2");
      expect(title.style.color).toBe("rgb(107, 114, 128)");
    });
  });

  describe("escapeAttribute", () => {
    it("neutralizes single and double quotes", () => {
      const bad = '" onclick="alert(1)"';
      const escaped = utils.escapeAttribute(bad);
      expect(escaped).not.toContain('"');
      expect(escaped).toContain("&quot;");
    });

    it("neutralizes angle brackets", () => {
      const bad = "<tag>";
      const escaped = utils.escapeAttribute(bad);
      expect(escaped).not.toContain("<");
      expect(escaped).toContain("&lt;");
    });
  });

  describe("ui.confirmDialog responsiveness", () => {
    it("removes dialog when cancel is clicked", async () => {
      document.body.innerHTML = "";
      const promise = ui.confirmDialog("Delete?");
      const buttons = Array.from(document.querySelectorAll("button"));
      const cancelBtn = buttons.find((b) => b.textContent === "Annulla");
      expect(cancelBtn).not.toBeNull();
      cancelBtn.click();
      await promise;
      expect(document.querySelector(".fixed")).toBeNull();
    });
  });
});
