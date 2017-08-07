MathJax.Hub.Config({
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  "HTML-CSS": {
    availableFonts: ["TeX"],
    imageFont: null
  },
  MathMenu: {
   showRenderer: false,
   showFontMenu: false,
   showLocale: false
  }
});
function Typeset(element) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
}
function Configured() {
    MathJax.Hub.Configured();
}
