import iconDark from "@/assets/LOGO_icon_image.png";
import nameDark from "@/assets/LOGO_NAME.png";
import iconLight from "@/assets/Light_theme_logo_icon.png";
import nameLight from "@/assets/light_theme_logo_name.png";


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
  const dark = variant === "icon" ? iconDark : nameDark;
  const light = variant === "icon" ? iconLight : nameLight;

  return (
    <>
      <img src={dark} alt="Abaad" draggable={false} className={`${className} logo-dark`} />
      <img src={light} alt="Abaad" draggable={false} className={`${className} logo-light`} />
    </>
  );
}
