const Slider = function () {};

Slider.prototype = {
    showSlides: function (className, slideIndex, timeout) {
        var i;
        var slides = document.getElementsByClassName(className);

        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1
        }

        if (slides.length > 0) {
            slides[slideIndex - 1].style.display = "block";
        }

        setTimeout(function () {
            slider.showSlides(className, slideIndex, timeout)
        }, timeout);
    }
};

const slider = new Slider();
