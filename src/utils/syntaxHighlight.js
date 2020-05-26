// from https://cheerego.github.io/2017/01/21/%E5%9C%A8Vue%E4%B8%AD%E4%BD%BF%E7%94%A8highlight.js/
import highlighter from 'highlight.js/lib/highlight';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import scss from 'highlight.js/lib/languages/scss';
import css from 'highlight.js/lib/languages/css';
import php from 'highlight.js/lib/languages/php';
import markdown from 'highlight.js/lib/languages/markdown';
import bash from 'highlight.js/lib/languages/bash';
import apache from 'highlight.js/lib/languages/apache';
import 'highlight.js/styles/monokai-sublime.css';
highlighter.registerLanguage('javascript', javascript);
highlighter.registerLanguage('typescript', typescript);
highlighter.registerLanguage('json', json);
highlighter.registerLanguage('python', python); // 样式文件
highlighter.registerLanguage('scss', scss);
highlighter.registerLanguage('css', css);
highlighter.registerLanguage('php', php);
highlighter.registerLanguage('markdown', markdown);
highlighter.registerLanguage('bash', bash);
highlighter.registerLanguage('apache', apache);

const Highlight = Vue => {
  // this translates into v-waypoint="{ active, callback }"
  Vue.directive('highlight', {
    inserted(el) {
      const blocks = el.querySelectorAll('.ql-syntax'); // used to say 'pre code' but quill exports code blocks as only pre without a <code> tag
      if (blocks.length > 0) {
        blocks.forEach(block => {
          highlighter.highlightBlock(block);
        });
      }
    },
  });
};

export { Highlight, highlighter };
