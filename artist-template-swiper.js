$('.swiper').each(function index() {
    let swiper = new Swiper(this, {
        slidesPerView: "auto",
        speed: 500,
        mousewheel: {
            forceToAxis: true,
        },
        keyboard: true,
        freeMode: true,
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        
    })

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

