Vue.use(VueMaterial.default)
Vue.component('type-writer', {
    template: `<div id="typewriter" class="line-1 glitch typewrite" data-text="" data-period="2000" data-type='[ "Hi, Im Joel Hanson.", "Backend with django is easy cause i know it.", "I am a open source contibuter.", "I Love to Develop.", "Heil Python!" ]'><span class="wrap"></span></div>`
})
Vue.component('button-counter', {
    data: function () {
      return {
        count: 0
      }
    },
    template: '<button v-on:click="count++">You clicked me {{ count }} times.</button>'
  })
var app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!'
    }
})

