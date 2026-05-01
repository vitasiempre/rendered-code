class FileInput {
  constructor(rootEl) {
    this.root = rootEl;
    this.list = rootEl.querySelector(".file-input__list");
    this.template = rootEl.querySelector(".file-row.is-template");
    this.selectButton = rootEl.querySelector(".file-input__select-button");
    this.hint = rootEl.querySelector(".file-input__hint");
    this.files = []; // array of { id, name, status, ... }

    this.maxFiles = parseInt(rootEl.dataset.maxFiles || "1");

    this.bindEvents();
  }

  addRow(file) {
    const row = this.template.cloneNode(true);
    row.classList.remove("is-template");
    row.querySelector(".file-row__name").textContent = file.name;
    row.dataset.fileId = file.id;

    row.querySelector(".file-row__delete").addEventListener("click", () => {
      this.removeRow(file.id);
    });

    this.list.appendChild(row);
  }

  setRowState(fileId, state) {
    const row = this.list.querySelector(`[data-file-id="${fileId}"]`);
    if (!row) return;

    row.classList.remove("is-uploading", "is-success", "is-error");
    row.classList.add(`is-${state}`);
  }

  removeRow(fileId) {
    const row = this.list.querySelector(`[data-file-id="${fileId}"]`);
    row?.remove();
    this.files = this.files.filter((f) => f.id !== fileId);
    this.updateSelectButtonVisibility();
  }

  updateSelectButtonVisibility() {
    const atLimit = this.files.length >= this.maxFiles;
    this.selectButton.style.display = atLimit ? "none" : "";
  }

  // ... bindEvents, handleSelect, validateFile, etc.
}
