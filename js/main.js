$(document).ready(function() {


    const lightBoxCont = document.querySelectorAll('.lightbox--cont');
    lightBoxCont.forEach(el => {
        // console.log(el)

        const lightBox = el.querySelector('.lightbox');
        const closebtn = el.querySelector('.btn-close');
        const videoElement = el.querySelector('video');
        const bclick = el.querySelector('.gallery__item');


        bclick.addEventListener("click", event => {
            lightBox.className = "lightbox open";
            
            // console.log(lightBox)
        });

        // closebtn.addEventListener("click", event => {
        //     lightBox.className = "lightbox";
        //     videoElement.pause();
        // });

        closebtn.addEventListener("click", event => {
            if (lightBox.className == "lightbox open") {
                lightBox.className = "lightbox";
                videoElement.pause();
            }
        });
    });




});