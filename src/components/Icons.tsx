import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

// Small stroke icons drawn on a 16px grid. They inherit the text color.
function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </Icon>
)

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
  </Icon>
)

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 3v10M3 8h10" />
  </Icon>
)

export const KeyIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="5.5" cy="10.5" r="3" />
    <path d="m7.6 8.4 5.9-5.9M11.5 4.5l1.5 1.5M10 6l1.25 1.25" />
  </Icon>
)

export const DocumentIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9.5 1.75H4.25a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5l-3.25-3.25Z" />
    <path d="M9.5 1.75V5h3.25M5.75 8.5h4.5M5.75 11h4.5" />
  </Icon>
)

export const ChartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2 13.75h12M4 11V8M7 11V4.5M10 11V6.5M13 11V3" />
  </Icon>
)
