<template>
  <div :class="flipped ? 'flip-container flipped' : 'flip-container'">
    <div class="flipper">
      <div :style="{ backgroundColor: colorFront }" class="flashcard front">
        <div v-highlight v-dompurify-html="front" class="card-content" />
      </div>
      <div :style="{ backgroundColor: colorBack }" class="flashcard back">
        <div v-highlight v-dompurify-html="back" class="card-content" />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    front: {
      type: String,
      default: '',
    },
    back: {
      type: String,
      default: '',
    },
    // Need to add a quill.js module for this
    colorFront: {
      type: String,
      default: 'white',
    },
    colorBack: {
      type: String,
      default: 'white',
    },
    flipped: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
};
</script>

<style scoped>
.flashcard {
  align-content: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 10px;
  box-shadow: 0 0px 10px rgba(0, 0, 0, 0.4);
  height: 100%;
  margin: auto;
  width: 100%;
  padding: 0px 7px 0px 15px;
}
.flashcard:hover {
  box-shadow: 0 0px 25px rgba(0, 0, 0, 0.8);
}
.card-content {
  padding: 10px 8px 0px 0px;
  margin: auto;
  height: 100%;
  overflow-y: auto;
}
.card-content::-webkit-scrollbar {
  width: 0.5em;
}
.card-content::-webkit-scrollbar-thumb {
  background-color: rgba(162, 162, 162, 0.5);
  border-radius: 0px;
}
/* use >>> to select nested elements inside a v-html */
.card-content >>> img {
  width: 100%;
  margin: auto;
  object-fit: fill;
}
.card-content >>> .ql-align-center {
  text-align: center;
}
.card-content >>> .ql-align-right {
  text-align: right;
}
.card-content >>> .ql-align-left {
  text-align: left;
}
.card-content >>> .ql-align-justify {
  text-align: justify;
}
.card-content >>> p {
  font-size: 1.5em;
}
.card-content >>> p .ql-size-small {
  font-size: 0.75em;
}
.card-content >>> p .ql-size-large {
  font-size: 2em;
}
.card-content >>> p .ql-size-huge {
  font-size: 3.5em;
}
.flip-container {
  -webkit-perspective: 1000;
  -moz-perspective: 1000;
  -o-perspective: 1000;
  perspective: 1000;
}
.flipper {
  -moz-transform: perspective(1000px);
  -moz-transform-style: preserve-3d;
  transform: perspective(1000px);
  transform-style: preserve-3d;
  position: relative;
  height: 100%;
}
.front,
.back {
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
  -o-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transition: 0.6s;
  -webkit-transform-style: preserve-3d;
  -moz-transition: 0.6s;
  -moz-transform-style: preserve-3d;
  -o-transition: 0.6s;
  -o-transform-style: preserve-3d;
  -ms-transition: 0.6s;
  -ms-transform-style: preserve-3d;
  transition: 0.6s;
  transform-style: preserve-3d;
  top: 0;
  left: 0;
  width: 100%;
}
.back {
  -webkit-transform: rotateY(-180deg);
  -moz-transform: rotateY(-180deg);
  -o-transform: rotateY(-180deg);
  -ms-transform: rotateY(-180deg);
  transform: rotateY(-180deg);
  position: absolute;
}
.flip-container.flipped .back {
  -webkit-transform: rotateY(0deg);
  -moz-transform: rotateY(0deg);
  -o-transform: rotateY(0deg);
  -ms-transform: rotateY(0deg);
  transform: rotateY(0deg);
}
.flip-container.flipped .front {
  -webkit-transform: rotateY(180deg);
  -moz-transform: rotateY(180deg);
  -o-transform: rotateY(180deg);
  -ms-transform: rotateY(180deg);
  transform: rotateY(180deg);
}
.back {
  z-index: 4;
}
</style>
