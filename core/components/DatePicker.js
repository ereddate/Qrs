import { reactive, Component, createElem } from "../index.js";

export default new Component({
  data() {
    return {
      showCalendar: false,
      selectedDate: this.props.value || null,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
    };
  },
  methods: {
    getDaysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    },
    getFirstDayOfMonth(year, month) {
      return new Date(year, month, 1).getDay();
    },
    prevMonth() {
      if (this.data.currentMonth === 0) {
        this.data.currentMonth = 11;
        this.data.currentYear--;
      } else {
        this.data.currentMonth--;
      }
    },
    nextMonth() {
      if (this.data.currentMonth === 11) {
        this.data.currentMonth = 0;
        this.data.currentYear++;
      } else {
        this.data.currentMonth++;
      }
    },
    selectDate(date) {
      this.data.selectedDate = new Date(
        this.data.currentYear,
        this.data.currentMonth,
        date
      );
      this.data.showCalendar = false;
      this.props.on.change?.(this.data.selectedDate);
    },
  },
  render() {
    const daysInMonth = this.props.methods.getDaysInMonth.bind(this)(
      this.data.currentYear,
      this.data.currentMonth
    );
    const firstDay = this.props.methods.getFirstDayOfMonth.bind(this)(
      this.data.currentYear,
      this.data.currentMonth
    );

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(createElem("div", { class: "day empty" }, ""));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = this.data.selectedDate;
      const isSelected =
        date &&
        date.getDate() === i &&
        date.getMonth() === this.data.currentMonth &&
        date.getFullYear() === this.data.currentYear;

      days.push(
        createElem(
          "div",
          {
            class: `day ${isSelected ? "selected" : ""}`,
            on: { click: () => this.props.methods.selectDate.bind(this)(i) },
          },
          i
        )
      );
    }

    return createElem("div", { class: "date-picker" }, [
      createElem("input", {
        type: "text",
        class: "date-input",
        value: this.data.selectedDate
          ? this.data.selectedDate.toLocaleDateString()
          : "",
        on: { focus: () => (this.data.showCalendar = true) },
      }),
      this.data.showCalendar &&
        createElem("div", { class: "calendar" }, [
          createElem("div", { class: "calendar-header" }, [
            createElem(
              "button",
              {
                on: { click: () => this.props.methods.prevMonth.bind(this)() },
              },
              "←"
            ),
            createElem(
              "span",
              {},
              `${this.data.currentYear}年${this.data.currentMonth + 1}月`
            ),
            createElem(
              "button",
              {
                on: { click: () => this.props.methods.nextMonth.bind(this)() },
              },
              "→"
            ),
          ]),
          createElem(
            "div",
            { class: "calendar-weekdays" },
            ["日", "一", "二", "三", "四", "五", "六"].map((day) =>
              createElem("div", { class: "weekday" }, day)
            )
          ),
          createElem("div", { class: "calendar-days" }, days),
        ]),
    ]);
  },
});
