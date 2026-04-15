process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_APP_URL = "https://delphi-atlas.vercel.app";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://zoirudjyqfqvpxsrxepr.supabase.co";
process.env.NEXT_PUBLIC_X_BASE_URL = "https://twitter.com";
process.env.NEXT_PUBLIC_UNAVATAR_ORIGIN = "https://unavatar.io";
process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL = "https://t.me/AtlasDelphiBot";
process.env.NEXT_PUBLIC_X_IMAGE_CDN_ORIGIN = "https://pbs.twimg.com";
process.env.NEXT_PUBLIC_GOOGLE_FONTS_STYLES_ORIGIN = "https://fonts.googleapis.com";
process.env.NEXT_PUBLIC_GOOGLE_FONTS_ASSETS_ORIGIN = "https://fonts.gstatic.com";
process.env.NEXT_PUBLIC_DEMO_SOURCE_URL = "https://example.com/sol-ath";

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
