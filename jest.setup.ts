process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";

// Polyfill HTMLDialogElement methods for jsdom
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
      this.setAttribute("data-modal", "true");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.removeAttribute("data-modal");
    };
  }
}
