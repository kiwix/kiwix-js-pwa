MathJax.Hub.Config({
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  TeX: {
	extensions: ["AMSmath.js", "AMSsymbols.js", "noUndefined.js"],
	noUndefined: {
		attributes: {
			mathcolor: "red",
			mathbackground: "#FFEEEE",
			mathsize: "90%"
		}
	}
  },
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