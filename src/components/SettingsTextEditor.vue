<template>
  <b-container id="main" fluid>
    <b-list-group-item button @click="openTextEditorSettings()">
      Text Editor
    </b-list-group-item>
    <b-list-group v-if="textEditorSettingsOpen" class="second-layer-settings">
      <b-container fluid>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleBold()">
              <b-container>
                <b-row>
                  <p>bold</p>
                  <font-awesome-icon
                    v-if="toolbarContent.bold"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.bold"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleItalic()">
              <b-container>
                <b-row>
                  <p>italic</p>
                  <font-awesome-icon
                    v-if="toolbarContent.italic"
                    class="toggle-btn my-auto "
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.italic"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleUnderline()">
              <b-container>
                <b-row>
                  <p>underline</p>
                  <font-awesome-icon
                    v-if="toolbarContent.underline"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.underline"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleStrike()">
              <b-container>
                <b-row>
                  <p>strike</p>
                  <font-awesome-icon
                    v-if="toolbarContent.strike"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.strike"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleSubScript()">
              <b-container>
                <b-row>
                  <p>sub script</p>
                  <font-awesome-icon
                    v-if="toolbarContent.subScript"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.subScript"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleCodeBlock()">
              <b-container>
                <b-row>
                  <p>code block</p>
                  <font-awesome-icon
                    v-if="toolbarContent.codeBlock"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.codeBlock"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleSuperScript()">
              <b-container>
                <b-row>
                  <p>super script</p>
                  <font-awesome-icon
                    v-if="toolbarContent.superScript"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.superScript"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleSize()">
              <b-container>
                <b-row>
                  <p>size</p>
                  <font-awesome-icon
                    v-if="toolbarContent.size"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.size"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleHeadings()">
              <b-container>
                <b-row>
                  <p>headings</p>
                  <font-awesome-icon
                    v-if="toolbarContent.headings"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.headings"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleColor()">
              <b-container>
                <b-row>
                  <p>color</p>
                  <font-awesome-icon
                    v-if="toolbarContent.color"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.color"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleBackground()">
              <b-container>
                <b-row>
                  <p>background</p>
                  <font-awesome-icon
                    v-if="toolbarContent.background"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.background"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleAlign()">
              <b-container>
                <b-row>
                  <p>alignment</p>
                  <font-awesome-icon
                    v-if="toolbarContent.align"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.align"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleList()">
              <b-container>
                <b-row>
                  <p>list</p>
                  <font-awesome-icon
                    v-if="toolbarContent.list"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.list"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleBlockquote()">
              <b-container>
                <b-row>
                  <p>block quote</p>
                  <font-awesome-icon
                    v-if="toolbarContent.blockquote"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.blockquote"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleFont()">
              <b-container>
                <b-row>
                  <p>font</p>
                  <font-awesome-icon
                    v-if="toolbarContent.font"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.font"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleClean()">
              <b-container>
                <b-row>
                  <p>clear formats</p>
                  <font-awesome-icon
                    v-if="toolbarContent.clean"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.clean"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleImage()">
              <b-container>
                <b-row>
                  <p>image</p>
                  <font-awesome-icon
                    v-if="toolbarContent.image"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.image"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleLink()">
              <b-container>
                <b-row>
                  <p>link</p>
                  <font-awesome-icon
                    v-if="toolbarContent.link"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.link"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleVideo()">
              <b-container>
                <b-row>
                  <p>video</p>
                  <font-awesome-icon
                    v-if="toolbarContent.video"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.video"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
          <b-col class="setting-col">
            <b-list-group-item class="text-editor-option" button @click="toggleFormula()">
              <b-container>
                <b-row>
                  <p>formula</p>
                  <font-awesome-icon
                    v-if="toolbarContent.formula"
                    class="toggle-btn my-auto"
                    icon="toggle-on"
                  />
                  <font-awesome-icon
                    v-if="!toolbarContent.formula"
                    class="toggle-btn my-auto"
                    icon="toggle-off"
                  />
                </b-row>
              </b-container>
            </b-list-group-item>
          </b-col>
        </b-row>

        <b-list-group-item>
          Preview
          <quill-editor
            :key="quillReRenderKey"
            ref="myQuillEditor"
            v-model="editorText"
            v-highlight
            class="quill"
            :options="editorOptions"
          ></quill-editor>
        </b-list-group-item>
      </b-container>
    </b-list-group>
  </b-container>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue';
import { isEqual } from 'lodash/core';
import { Quill, quillEditor } from 'vue-quill-editor';
import 'quill/dist/quill.snow.css';
import imageUpload from 'quill-plugin-image-upload';
Quill.register('modules/imageUpload', imageUpload);
const axios = require('axios');
const FormData = require('form-data');
export default {
  name: 'TextEditorSettings',
  components: { BListGroup, BListGroupItem, quillEditor },
  data() {
    return {
      textEditorSettingsOpen: false,
      quillReRenderKey: 0,
      toolbarContent: {
        bold: null,
        italic: null,
        underline: null,
        strike: null,
        codeBlock: null,
        subScript: null,
        subScriptObj: { script: 'sub' },
        superScript: null,
        superScriptObj: { script: 'super' },
        size: null,
        sizeObj: { size: ['small', false, 'large', 'huge'] },
        headings: null,
        headingsObj: { header: [1, 2, 3, 4, 5, 6, false] },
        color: null,
        colorObj: { color: [] },
        background: null,
        backgroundObj: { background: [] },
        align: null,
        alignObj: { align: [] },
        list: null,
        listObj: { list: 'bullet' },
        blockquote: null,
        font: null,
        fontObj: { font: [] },
        clean: null,
        image: null,
        link: null,
        formula: null,
        video: null,
      },
      editorText: 'Try out the settings here',
    };
  },
  computed: {
    editorOptions() {
      return {
        theme: 'snow',
        modules: {
          imageUpload: {
            upload: file => {
              const gateway = 'https://gateway.pinata.cloud/ipfs/';
              const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
              const data = new FormData();
              data.append('file', file);
              const metadata = JSON.stringify({
                name: 'testname',
                keyvalues: {
                  exampleKey: 'exampleValue',
                },
              });
              data.append('pinataMetadata', metadata);
              return axios
                .post(url, data, {
                  maxContentLength: 'Infinity', // this is needed to prevent axios from erroring out with large files
                  headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    pinata_api_key: this.pinataKeys.pinata_api,
                    pinata_secret_api_key: this.pinataKeys.pinata_key,
                  },
                })
                .then(function(response) {
                  return gateway + response.data.IpfsHash;
                })
                .catch(function() {
                  // console.log(error)
                });
            },
          },
          toolbar: this.toolbar,
          syntax: {
            highlight: text => window.hljs.highlightAuto(text).value,
          },
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true,
          },
        },
      };
    },
    toolbar() {
      if (
        this.$store.state.userCollection.webapp_settings.textEditorSettings.editorOptions.toolbar
      ) {
        return this.$store.state.userCollection.webapp_settings.textEditorSettings.editorOptions
          .toolbar;
      } else {
        return ['bold'];
      }
    },
  },
  watch: {
    toolbar: {
      handler: function() {
        this.resetTextEditorMenu();
      },
      deep: true,
    },
  },
  methods: {
    openTextEditorSettings() {
      this.resetTextEditorMenu();
      this.textEditorSettingsOpen = !this.textEditorSettingsOpen;
    },
    resetTextEditorMenu() {
      if (this.toolbar.includes('bold')) {
        this.toolbarContent.bold = true;
      } else {
        this.toolbarContent.bold = false;
      }
      if (this.toolbar.includes('italic')) {
        this.toolbarContent.italic = true;
      } else {
        this.toolbarContent.italic = false;
      }
      if (this.toolbar.includes('underline')) {
        this.toolbarContent.underline = true;
      } else {
        this.toolbarContent.underline = false;
      }
      if (this.toolbar.includes('strike')) {
        this.toolbarContent.strike = true;
      } else {
        this.toolbarContent.strike = false;
      }
      if (this.toolbar.includes('code-block')) {
        this.toolbarContent.codeBlock = true;
      } else {
        this.toolbarContent.codeBlock = false;
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.subScriptObj)) {
          if (i.script === this.toolbarContent.subScriptObj.script) {
            this.toolbarContent.subScript = true;
            break;
          }
        } else {
          this.toolbarContent.subScript = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.superScriptObj)) {
          if (i.script === this.toolbarContent.superScriptObj.script) {
            this.toolbarContent.superScript = true;
            break;
          }
        } else {
          this.toolbarContent.superScript = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.sizeObj)) {
          this.toolbarContent.size = true;
          break;
        } else {
          this.toolbarContent.size = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.headingsObj)) {
          this.toolbarContent.headings = true;
          break;
        } else {
          this.toolbarContent.headings = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.colorObj)) {
          this.toolbarContent.color = true;
          break;
        } else {
          this.toolbarContent.color = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.backgroundObj)) {
          this.toolbarContent.background = true;
          break;
        } else {
          this.toolbarContent.background = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.alignObj)) {
          this.toolbarContent.align = true;
          break;
        } else {
          this.toolbarContent.align = false;
        }
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.fontObj)) {
          this.toolbarContent.font = true;
          break;
        } else {
          this.toolbarContent.font = false;
        }
      }
      if (this.toolbar.includes('clean')) {
        this.toolbarContent.clean = true;
      } else {
        this.toolbarContent.clean = false;
      }
      if (this.toolbar.includes('image')) {
        this.toolbarContent.image = true;
      } else {
        this.toolbarContent.image = false;
      }
      if (this.toolbar.includes('link')) {
        this.toolbarContent.link = true;
      } else {
        this.toolbarContent.link = false;
      }
      if (this.toolbar.includes('video')) {
        this.toolbarContent.video = true;
      } else {
        this.toolbarContent.video = false;
      }
      if (this.toolbar.includes('formula')) {
        this.toolbarContent.formula = true;
      } else {
        this.toolbarContent.formula = false;
      }
      for (const i of this.toolbar) {
        if (isEqual(i, this.toolbarContent.listObj)) {
          this.toolbarContent.list = true;
          break;
        } else {
          this.toolbarContent.list = false;
        }
      }
      if (this.toolbar.includes('blockquote')) {
        this.toolbarContent.blockquote = true;
      } else {
        this.toolbarContent.blockquote = false;
      }
    },
    updateToolbar(value, bool) {
      const newToolbar = JSON.parse(JSON.stringify(this.toolbar));
      let existsCount = 0;
      // to fix funkyness with lodash seeing scriptobj and subscriptobj as equal
      if (value.script) {
        for (const i of newToolbar) {
          if (i.script) {
            if (i.script === value.script) {
              existsCount++;
              if (!bool) {
                const toDeleteIndex = newToolbar.indexOf(i);
                newToolbar.splice(toDeleteIndex, 1);
                break;
              }
            }
          }
        }
      } else {
        for (const i of newToolbar) {
          if (isEqual(i, value)) {
            existsCount++;
            if (!bool) {
              const toDeleteIndex = newToolbar.indexOf(i);
              newToolbar.splice(toDeleteIndex, 1);
              break;
            }
          }
        }
      }
      if (bool && existsCount === 0) {
        newToolbar.push(value);
      }
      const editorOptions = { toolbar: newToolbar };
      const settingData = {
        settingSection: 'textEditorSettings',
        settingName: 'editorOptions',
        setting: editorOptions,
      };
      this.$store.commit('updateSetting', settingData);
      this.quillReRenderKey++;
    },
    toggleBold() {
      this.toolbarContent.bold = !this.toolbarContent.bold;
      this.updateToolbar('bold', this.toolbarContent.bold);
    },
    toggleItalic() {
      this.toolbarContent.italic = !this.toolbarContent.italic;
      this.updateToolbar('italic', this.toolbarContent.italic);
    },
    toggleUnderline() {
      this.toolbarContent.underline = !this.toolbarContent.underline;
      this.updateToolbar('underline', this.toolbarContent.underline);
    },
    toggleStrike() {
      this.toolbarContent.strike = !this.toolbarContent.strike;
      this.updateToolbar('strike', this.toolbarContent.strike);
    },
    toggleCodeBlock() {
      this.toolbarContent.codeBlock = !this.toolbarContent.codeBlock;
      this.updateToolbar('code-block', this.toolbarContent.codeBlock);
    },
    toggleSubScript() {
      this.toolbarContent.subScript = !this.toolbarContent.subScript;
      this.updateToolbar(this.toolbarContent.subScriptObj, this.toolbarContent.subScript);
    },
    toggleSuperScript() {
      this.toolbarContent.superScript = !this.toolbarContent.superScript;
      this.updateToolbar(this.toolbarContent.superScriptObj, this.toolbarContent.superScript);
    },
    toggleSize() {
      this.toolbarContent.size = !this.toolbarContent.size;
      this.updateToolbar(this.toolbarContent.sizeObj, this.toolbarContent.size);
    },
    toggleHeadings() {
      this.toolbarContent.headings = !this.toolbarContent.headings;
      this.updateToolbar(this.toolbarContent.headingsObj, this.toolbarContent.headings);
    },
    toggleColor() {
      this.toolbarContent.color = !this.toolbarContent.color;
      this.updateToolbar(this.toolbarContent.colorObj, this.toolbarContent.color);
    },
    toggleBackground() {
      this.toolbarContent.background = !this.toolbarContent.background;
      this.updateToolbar(this.toolbarContent.backgroundObj, this.toolbarContent.background);
    },
    toggleAlign() {
      this.toolbarContent.align = !this.toolbarContent.align;
      this.updateToolbar(this.toolbarContent.alignObj, this.toolbarContent.align);
    },
    toggleFont() {
      this.toolbarContent.font = !this.toolbarContent.font;
      this.updateToolbar(this.toolbarContent.fontObj, this.toolbarContent.font);
    },
    toggleClean() {
      this.toolbarContent.clean = !this.toolbarContent.clean;
      this.updateToolbar('clean', this.toolbarContent.clean);
    },
    toggleImage() {
      this.toolbarContent.image = !this.toolbarContent.image;
      this.updateToolbar('image', this.toolbarContent.image);
    },
    toggleLink() {
      this.toolbarContent.link = !this.toolbarContent.link;
      this.updateToolbar('link', this.toolbarContent.link);
    },
    toggleVideo() {
      this.toolbarContent.video = !this.toolbarContent.video;
      this.updateToolbar('video', this.toolbarContent.video);
    },
    toggleFormula() {
      this.toolbarContent.formula = !this.toolbarContent.formula;
      this.updateToolbar('formula', this.toolbarContent.formula);
    },
    toggleList() {
      this.toolbarContent.list = !this.toolbarContent.list;
      this.updateToolbar(this.toolbarContent.listObj, this.toolbarContent.list);
    },
    toggleBlockquote() {
      this.toolbarContent.blockquote = !this.toolbarContent.blockquote;
      this.updateToolbar('blockquote', this.toolbarContent.blockquote);
    },
  },
};
</script>

<style scoped>
#main {
  padding: 0;
}
.toggle-btn {
  margin-left: auto;
  padding-right: 5px;
}
p {
  margin: 0px 5px;
}
.second-layer-settings {
  padding: 5px 0px;
}
.text-editor-option {
  padding: 5px 5px;
  margin-bottom: 5px;
}
.setting-col {
  padding: 0px 3px;
}
</style>
