// from https://cheerego.github.io/2017/01/21/%E5%9C%A8Vue%E4%B8%AD%E4%BD%BF%E7%94%A8highlight.js/
import highlighter from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import 'highlight.js/styles/monokai-sublime.css';
highlighter.registerLanguage('javascript', javascript);
highlighter.registerLanguage('python', python); // 样式文件
const Highlight = {};
Highlight.install = function(Vue) {
  Vue.directive('highlight', function(el) {
    const blocks = el.querySelectorAll('pre'); // used to say 'pre code' but quill exports code blocks as only pre without a <code> tag
    blocks.forEach(block => {
      highlighter.highlightBlock(block);
    });
  });
};
export default Highlight;
