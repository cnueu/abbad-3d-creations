import iconDark from "@/assets/LOGO_icon_image.png.asset.json";
import nameDark from "@/assets/LOGO_NAME.png.asset.json";
import iconLight from "@/assets/Light_theme_logo_icon.png.asset.json";
import nameLight from "@/assets/light_theme_logo_name.png.asset.json";

/**
 * Brand logo. Two artwork sets exist — one for each theme — and the correct
 * one is shown purely with CSS (see `.logo-dark` / `.logo-light` in index.css),
 * so there is no flash when the theme toggles.
 *
 * variant="icon"  → the cube mark only
 * variant="name"  → the Abaad / أبعاد wordmark
 */
export function Logo({
  className = "",
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "name";
}) {
  const dark = variant === "icon" ? iconDark.url : nameDark.url;
  const light = variant === "icon" ? iconLight.url : nameLight.url;
  return (
    <>
      <img src={dark} alt="Abaad" draggable={false} className={`${className} logo-dark`} />
      <img src={light} alt="Abaad" draggable={false} className={`${className} logo-light`} />
    </>
  );
}
