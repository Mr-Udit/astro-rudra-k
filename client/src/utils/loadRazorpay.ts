export const loadRazorpay = (src: string) => {
  return new Promise<boolean>((resolve) => {
    // Avoid inserting duplicate scripts
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === "true") {
        return resolve(true);
      }
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script")

    script.src = src

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(true);
    }
    script.onerror = () => resolve(false)

    document.body.appendChild(script)
  })
}
