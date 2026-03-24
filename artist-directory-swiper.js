$('.slider-main-component').each(function index() {
    const swiperEl = $(this).find(".swiper")[0];

    let swiper;

    function initSwiper() {
    if (swiper) swiper.destroy(true, true);
    
    const isMobile = window.innerWidth < 767;
    
    swiper = new Swiper(swiperEl, {
        slidesPerView: "auto",
        speed: 500,
        mousewheel: { forceToAxis: true },
        keyboard: true,
        freeMode: true,
        spaceBetween: 30,
        centeredSlides: isMobile,
        loop: isMobile,
        loopAdditionalSlides: isMobile ? 3 : 0,
    });
    }

    initSwiper();
    window.addEventListener('resize', initSwiper);

    const s = document.querySelector(".swiper").swiper;
    console.log("container", s.width);
    console.log("virtualSize", s.virtualSize);
    console.log("isLocked", s.isLocked);

    function refreshSwiper() {
      swiper.updateSize();
      swiper.updateSlides();
      swiper.updateProgress();
      swiper.updateSlidesClasses();
      swiper.navigation.update();
    }

    // after full page load
    window.addEventListener("load", refreshSwiper);

    // after each image inside this slider loads
    $(this).find("img").each(function () {
        if (this.complete) return;
        this.addEventListener("load", refreshSwiper);
    });

});

