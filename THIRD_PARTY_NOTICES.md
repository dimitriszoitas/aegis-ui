# Third-party notices

Aegis's original source code is MIT licensed; see LICENSE. That license does not relicense third-party fonts, artwork, or trademarks.

## Fonts

The optional `fonts.css` entry includes self-hosted Figtree and JetBrains Mono font files distributed through Fontsource. Both font families use the SIL Open Font License 1.1. The original copyright notices and complete license texts are included in `lib-dist/licenses/figtree-OFL.txt` and `lib-dist/licenses/jetbrains-mono-OFL.txt`.

The marketing website separately includes self-hosted Inter Latin font files from Fontsource 5.3.0, under the SIL Open Font License 1.1. Its copyright and license are preserved in `src/marketing/fonts/Inter-OFL.txt`. These website fonts are not included in the design system package.

## AWS architecture artwork

The optional `@dimitriszoitas/aegis-ui/aws-logo` entry includes original SVG architecture artwork owned by Amazon Web Services. AWS names and marks remain AWS-owned; inclusion does not imply endorsement. This artwork is not covered by Aegis's MIT license. Source, release information, use guidance, and asset checksums are included in `lib-dist/licenses/AWS-ATTRIBUTION.md` and `lib-dist/licenses/AWS-checksums.json`. See [AWS architecture icons](https://aws.amazon.com/architecture/icons/) for the original artwork and current guidance.

## Runtime dependencies

The compiled `styles.css` includes CSS from Tailwind CSS (Tailwind Labs), tw-animate-css (Wombosvideo), and React DayPicker (Giampaolo Bellavite). Their complete original MIT license texts are included in `lib-dist/licenses/tailwindcss-MIT.txt`, `lib-dist/licenses/tw-animate-css-MIT.txt`, and `lib-dist/licenses/react-day-picker-MIT.txt`.

Aegis's React modules reference external runtime dependencies instead of redistributing their source inside the library bundle. Those packages retain their own licenses and notices. The Hugeicons free icon pack and React renderer are MIT licensed and supplied as dependencies.

The locally installed Untitled UI reference gallery is excluded from this package's public exports, dependency list, assets, and output bundles.
