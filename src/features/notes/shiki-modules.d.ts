declare module "@shikijs/langs/*" {
  const language: import("shiki/core").LanguageRegistration[]
  export default language
}

declare module "@shikijs/themes/*" {
  const theme: import("shiki/core").ThemeRegistration
  export default theme
}
