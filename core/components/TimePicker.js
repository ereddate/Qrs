import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      showTimePanel: false,
      selectedTime: this.props.value || null,
      hours: 0,
      minutes: 0,
    };
  },
  methods: {
    selectTime() {
      this.data.selectedTime = new Date();
      this.data.selectedTime.setHours(this.data.hours);
      this.data.selectedTime.setMinutes(this.data.minutes);
      this.data.showTimePanel = false;
      this.props.on.change?.(this.data.selectedTime);
    },
  },
  render() {
    return createElem("div", { class: "time-picker" }, [
      createElem("input", {
        type: "text",
        class: "time-input",
        value: this.data.selectedTime
          ? `${this.data.selectedTime.getHours()}:${this.data.selectedTime.getMinutes()}`
          : "",
        on: { focus: () => (this.data.showTimePanel = true) },
      }),
      this.data.showTimePanel &&
        createElem("div", { class: "time-panel" }, [
          createElem("div", { class: "time-selector" }, [
            createElem(
              "select",
              {
                on: {
                  change: (e) => (this.data.hours = parseInt(e.target.value)),
                },
              },
              Array.from({ length: 24 }, (_, i) =>
                createElem("option", { value: i }, i)
              )
            ),
            createElem("span", {}, ":"),
            createElem(
              "select",
              {
                on: {
                  change: (e) => (this.data.minutes = parseInt(e.target.value)),
                },
              },
              Array.from({ length: 60 }, (_, i) =>
                createElem("option", { value: i }, i)
              )
            ),
          ]),
          createElem(
            "button",
            {
              on: { click: () => this.props.methods.selectTime.bind(this)() },
            },
            "确定"
          ),
        ]),
    ]);
  },
});
