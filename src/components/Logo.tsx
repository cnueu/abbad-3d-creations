import logo from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  // Logo image is white on transparent. On light theme, invert to black for visibility.
  return (
    <img
      src={logo}
      alt="ABBAD logo"
      draggable={false}
      className={`${className} abbad-logo-invert`}
    />
  );
}
