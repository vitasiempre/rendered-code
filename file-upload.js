const VERCEL_API_BASE = "https://rendered-code-peach.vercel.app";

class FileInput {
  constructor(rootEl) {
    this.root = rootEl;
    this.fieldName = rootEl.dataset.fieldName;
    this.minFiles = parseInt(rootEl.dataset.minFiles || "1", 10);
    this.maxFiles = parseInt(rootEl.dataset.maxFiles || "1", 10);
    this.accept = (rootEl.dataset.accept || "").split(",");

    this.list = rootEl.querySelector(".file-input__list");
    this.template = rootEl.querySelector(".file-row.is-template");
    this.nativeInput = rootEl.querySelector(".file-input__input");
    this.fieldWrapper = rootEl.querySelector(".file-input__field-wrapper");

    this.files = [];

    this.bindEvents();
    this.updateMaxState();
  }

  bindEvents() {
    this.nativeInput.addEventListener("change", (e) => {
      const selected = Array.from(e.target.files);
      e.target.value = "";
      this.handleFilesSelected(selected);
    });
  }

  async handleFilesSelected(filesArr) {
    for (const file of filesArr) {
      const validFiles = this.files.filter((f) => f.status !== "error");
      console.log("Trying to handle,", validFiles.length >= this.maxFiles);
      if (validFiles.length >= this.maxFiles) break;
      this.uploadFile(file);
    }
  }

  async uploadFile(file) {
    const fileId = crypto.randomUUID();
    const fileEntry = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      path: null,
    };
    this.files.push(fileEntry);

    this.addRow(fileEntry);

    if (!this.accept.includes(file.type)) {
      this.setRowError(fileId, "Format not allowed");
      return;
    }

    try {
      const res = await fetch(`${VERCEL_API_BASE}/api/get-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          type: file.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        this.setRowError(fileId, data.error || "Upload failed");
        return;
      }

      const { uploadUrl, path } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        this.setRowError(fileId, "Upload failed");
        return;
      }

      fileEntry.path = path;
      fileEntry.status = "success";
      this.setRowState(fileId, "success");
    } catch (err) {
      console.error("Upload error:", err);
      this.setRowError(fileId, "Upload failed");
    }
  }

  addRow(fileEntry) {
    const row = this.template.cloneNode(true);
    row.classList.remove("is-template");
    row.classList.add("is-uploading");
    row.dataset.fileId = fileEntry.id;
    row.querySelector(".file-row__title").textContent = fileEntry.name;

    row.querySelector(".file-row__delete").addEventListener("click", () => {
      this.removeRow(fileEntry.id);
    });

    this.list.appendChild(row);
    return row;
  }

  setRowState(fileId, state) {
    const row = this.list.querySelector(`[data-file-id="${fileId}"]`);
    if (!row) return;
    row.classList.remove("is-uploading", "is-success", "is-error");
    row.classList.add(`is-${state}`);
    this.updateMaxState();
  }

  setRowError(fileId, message) {
    const fileEntry = this.files.find((f) => f.id === fileId);
    if (fileEntry) fileEntry.status = "error";

    const row = this.list.querySelector(`[data-file-id="${fileId}"]`);
    if (!row) return;
    row.classList.remove("is-uploading", "is-success");
    row.classList.add("is-error");
    const errorTextEl = row.querySelector(".file-row__error-text");
    if (errorTextEl) errorTextEl.textContent = message;
    this.updateMaxState();
  }

  removeRow(fileId) {
    const row = this.list.querySelector(`[data-file-id="${fileId}"]`);
    row?.remove();
    this.files = this.files.filter((f) => f.id !== fileId);
    this.updateMaxState();
  }

  updateMaxState() {
    const validFiles = this.files.filter((f) => f.status !== "error");
    const atMax = validFiles.length >= this.maxFiles;
    console.log("validFiles:", validFiles, "/");
    this.root.classList.toggle("is-at-max", atMax);
  }

  validate() {
    const validFiles = this.files.filter((f) => f.status === "success");
    const hasErrors = this.files.some((f) => f.status === "error");

    if (hasErrors) return false;
    if (validFiles.length < this.minFiles) return false;
    if (validFiles.length > this.maxFiles) return false;
    return true;
  }

  getPaths() {
    return this.files.filter((f) => f.status === "success").map((f) => f.path);
  }
}

function initFileInputs() {
  const inputs = [];
  document.querySelectorAll(".file-upload-input").forEach((el) => {
    inputs.push(new FileInput(el));
  });
  window.fileInputs = inputs;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFileInputs);
} else {
  initFileInputs();
}
