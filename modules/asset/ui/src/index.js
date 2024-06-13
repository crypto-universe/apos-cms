export default () => {
  // Your own project level JS may go here
  console.log('Hello World');

  $(document).ready(function() {
    // Изначально скрываем все шаги формы
    $(".form").hide();

    // Отображаем первый шаг
    $(".data-step-1").fadeIn(500);

    // Обработчик для клика по кнопке "Далее"
    $(".form__link_next").click(function(e) {
      e.preventDefault();
      let link = $(this).attr("data-link"),
          current = $(this).attr("data-current"),
          num = $(this).attr("data-num");

      if (current == "data-step-1_1" && $("input[name='checkbox_step2']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $("." + link).fadeIn(500);
        var e = $("input[name='checkbox_step2']:checked").siblings(".checkbox__descr").text();
        console.log(e);
      } else if (current == "data-step-1_2" && $("input[name='checkbox_step3']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $("." + link).fadeIn(500);
        var t = $("input[name='checkbox_step3']:checked").siblings(".checkbox__descr").text();
        console.log(t);
      } else if (current == "data-step-1_3" && $("input[name='checkbox_step4']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $("." + link).fadeIn(500);
        var n = $("input[name='checkbox_step4']:checked").siblings(".checkbox__descr").text();
        console.log(n);
      } else if (current == "data-step-2_1" && $("input[name='checkbox_step10']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $("." + link).fadeIn(500);
        var i = $("input[name='checkbox_step10']:checked").siblings(".checkbox__descr").text();
        console.log(i);
      } else if (current == "data-step-2_2" && $("input[name='checkbox_step11']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $("." + link).fadeIn(500);
        var a = $("input[name='checkbox_step11']:checked").siblings(".checkbox__descr").text();
        console.log(a);
      } else {
        alert("Пожалуйста, выберите один из вариантов, чтобы продолжить.");
      }
      return !1;
    });

    // Обработчик для клика по кнопке "Назад"
    $(".form__link_back").click(function(e) {
      e.preventDefault();
      let link = $(this).attr("data-link"),
          num = $(this).attr("data-num");

      $(".pagination__item .pagination__link").removeClass("pagination__link_active");
      for (let f = 1; f <= num; f++) {
        $(".pagination__item" + f + " .pagination__link").addClass("pagination__link_active");
      }
      $(".form").hide();
      $("." + link).fadeIn(500);
      return !1;
    });

    // Обработчик для клика по кнопке "Рассчитать"
    $(".form__link_complit").click(function(e) {
      e.preventDefault();
      let current = $(this).attr("data-current"),
          num = $(this).attr("data-num");

      if (current == "data-step-1_4" && $("input[name='checkbox_step5']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $(".data-step-1_10").fadeIn(500);
        let e = 0;
        $(".inpsumm:checked").each(function() {
          let t = parseInt($(this).attr("data-price"));
          e += t;
        });
        $(".form__price").html(e.toLocaleString("ru") + " руб");
        $("#summ").val(e);
        $(".calculator__main-title").html("остался один шаг");
      } else if (current == "data-step-2_2" && $("input[name='checkbox_step11']:checked").val()) {
        $(".pagination__item" + num + " .pagination__link").addClass("pagination__link_active");
        $(".form").hide();
        $(".data-step-1_10").fadeIn(500);
        let e = 0;
        $(".inpsumm:checked").each(function() {
          let t = parseInt($(this).attr("data-price"));
          e += t;
        });
        $(".form__price").html(e.toLocaleString("ru") + " ₽");
        $("#summ").val(e);
        $(".calculator__main-title").html("остался один шаг");
      } else {
        alert("Пожалуйста, выберите один из вариантов, чтобы продолжить.");
      }
      return !1;
    });

    // Обработчик для скролла
    $(".scroll").on("click", function() {
      let e = $(this).attr("href");
      $("html, body").animate({scrollTop: $(e).offset().top - 50}, {duration: 1200});
      return !1;
    });

    // Маска для ввода телефона
    Inputmask("+7 999 999 99 99").mask(document.querySelectorAll(".phone-mask"));

    // Проверка состояния кнопки "Далее"
    $(".checkbox").change(function() {
      let currentStep = $(this).closest('.form');
      let nextButton = currentStep.find('.form__link_next');
      if ($("input[type='radio']:checked", currentStep).length > 0) {
        nextButton.removeClass('form__link_disable');
      } else {
        nextButton.addClass('form__link_disable');
      }
    });
  });


};
