import { Component } from "../component.js";
import { createVnode } from "../vnode.js";

const Image = new Component({
  data() {
    return {
      isLoading: true,
      loadError: false,
      showPreview: false,
    };
  },
  mounted() {
    if (this.props.lazy) {
      this.props.methods.initLazyLoad.bind(this)();
    } else {
      this.props.methods.loadImage.bind(this)();
    }
  },
  methods: {
    initLazyLoad() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.props.methods.loadImage.bind(this)();
            observer.unobserve(this.el);
          }
        });
      });
      observer.observe(this.el);
    },
    loadImage() {
      const img = new window.Image();
      img.src = this.props.src;
      img.onload = () => {
        this.data.isLoading = false;
        this.data.loadError = false;
      };
      img.onerror = () => {
        this.data.isLoading = false;
        this.data.loadError = true;
      };
    },
    handlePreview() {
      if (this.props.previewSrcList?.length) {
        this.data.showPreview = true;
      }
    },
  },
  render() {
    return createVnode(
      "div",
      {
        class: "x-image",
        style: {
          position: "relative",
          overflow: "hidden",
        },
      },
      [
        // 图片主体
        createVnode("img", {
          style: {
            width: "100%",
            height: "100%",
            objectFit: this.props.fit,
            cursor: this.props.previewSrcList ? "pointer" : null,
          },
          src: this.data.isLoading ? null : this.props.src,
          on: { click: this.props.methods.handlePreview.bind(this) },
        }),

        // 加载状态
        this.data.isLoading &&
          createVnode("div", {
            class: "x-image__placeholder",
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "#f5f7fa",
            },
          }),

        // 错误状态
        this.data.loadError &&
          createVnode(
            "div",
            {
              class: "x-image__error",
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "#f56c6c",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            "加载失败"
          ),
      ]
    );
  },
});

export default Image;
