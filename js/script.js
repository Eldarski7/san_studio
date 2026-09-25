// Находим элементы на странице по их id (те, что мы задали в HTML)
const burger = document.getElementById('navBurger');
const menu = document.getElementById('navMenu');
const nav = document.querySelector('.nav');

// Вешаем обработчик клика на кнопку-гамбургер
burger.addEventListener('click', () => {
    // classList.toggle — если класса нет, добавляет его; если есть — убирает.
    // Один и тот же клик и открывает, и закрывает меню.
    burger.classList.toggle('is-open');
    menu.classList.toggle('is-open');

    // Пока меню открыто — запрещаем прокрутку страницы позади него
    if (menu.classList.contains('is-open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

// Находим все ссылки внутри меню и закрываем меню при клике на любую из них
// (иначе после перехода к секции панель осталась бы открытой поверх контента)
const menuLinks = menu.querySelectorAll('a');

menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
        burger.classList.remove('is-open');
        menu.classList.remove('is-open');
        document.body.style.overflow = '';
    });
});

// ==================== ЛАЙТБОКС ПОРТФОЛИО ====================

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const portfolioGrid = document.getElementById('portfolioGrid');

let projectsData = [];   // сюда попадёт содержимое projects.json
let currentImages = [];  // массив фото текущего открытого проекта
let currentIndex = 0;    // какое фото сейчас показано

// Загружаем данные один раз при старте страницы
fetch('portfolio/projects.json')
    .then((response) => response.json())
    .then((data) => {
        projectsData = data;
        applyCovers();
    })
    .catch((error) => {
        console.error('Не удалось загрузить projects.json:', error);
    });

// Проставляет фон каждой карточки из поля "cover" в JSON —
// теперь путь к обложке нужно менять только в projects.json, а не в HTML
function applyCovers() {
    const items = portfolioGrid.querySelectorAll('.portfolio__item');

    items.forEach((item) => {
        const project = projectsData.find((p) => p.id === item.dataset.project);

        if (project && project.cover) {
            item.style.backgroundImage = `url('${project.cover}')`;
        }
    });
}

function openLightbox(projectId) {
    const project = projectsData.find((item) => item.id === projectId);

    if (!project || !project.images.length) {
        return;
    }

    currentImages = project.images;
    currentIndex = 0;

    renderImage();

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // запрещаем скролл страницы под лайтбоксом
}

function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function renderImage() {
    lightboxImage.src = currentImages[currentIndex];
    lightboxCounter.textContent = (currentIndex + 1) + ' / ' + currentImages.length;
}

function showPrev() {
    // остаток от деления даёт зацикливание: с первого фото "назад" уходим на последнее
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    renderImage();
}

function showNext() {
    currentIndex = (currentIndex + 1) % currentImages.length;
    renderImage();
}

// Клик по любой карточке в сетке портфолио — открываем именно её проект.
// Слушатель повешен на общий контейнер (делегирование), а не на каждую карточку —
// это упрощает добавление новых проектов в HTML без правки JS.
portfolioGrid.addEventListener('click', (event) => {
    const item = event.target.closest('.portfolio__item');

    if (!item) {
        return;
    }

    openLightbox(item.dataset.project);
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrev);
lightboxNext.addEventListener('click', showNext);

// ==================== СВАЙП ПАЛЬЦЕМ (мобильный лайтбокс) ====================

const lightboxStage = document.querySelector('.lightbox__stage');
let touchStartX = 0;
let touchEndX = 0;

lightboxStage.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

lightboxStage.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].clientX;

    const delta = touchEndX - touchStartX;
    const SWIPE_THRESHOLD = 40; // минимальная длина свайпа в пикселях, чтобы отсечь случайные касания

    if (delta > SWIPE_THRESHOLD) {
        showPrev(); // свайп вправо — предыдущее фото
    } else if (delta < -SWIPE_THRESHOLD) {
        showNext(); // свайп влево — следующее фото
    }
}, { passive: true });

// Закрытие по клику на тёмный фон (но не по самому изображению/кнопкам)
lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

// ==================== ЛАЙТБОКС ВИДЕО ====================

const videoPreview = document.getElementById('videoPreview');
const videoPreviewPlayer = document.getElementById('videoPreviewPlayer');
const videoLightbox = document.getElementById('videoLightbox');
const videoLightboxPlayer = document.getElementById('videoLightboxPlayer');
const videoLightboxClose = document.getElementById('videoLightboxClose');
const videoMobileViewport = window.matchMedia('(max-width: 768px)');

function getResponsiveVideoId(player) {
    return player.dataset[videoMobileViewport.matches ? 'vimeoMobile' : 'vimeoDesktop'];
}

function sendVimeoCommand(player, method) {
    if (player.contentWindow && player.src) {
        player.contentWindow.postMessage(JSON.stringify({ method }), 'https://player.vimeo.com');
    }
}

function setVimeoSource(player, isPreview) {
    const videoId = getResponsiveVideoId(player);
    const params = new URLSearchParams({
        app_id: '122963',
        autoplay: '1',
        controls: isPreview ? '0' : '1',
        dnt: '1',
        loop: isPreview ? '1' : '0',
        muted: isPreview ? '1' : '0',
        playsinline: '1',
        title: '0',
        byline: '0',
        portrait: '0'
    });

    if (isPreview) {
        params.set('background', '1');
    }

    player.src = `https://player.vimeo.com/video/${videoId}?${params}`;
}

setVimeoSource(videoPreviewPlayer, true);
videoMobileViewport.addEventListener('change', () => {
    if (videoLightbox.classList.contains('is-open')) {
        setVimeoSource(videoLightboxPlayer, false);
    } else {
        setVimeoSource(videoPreviewPlayer, true);
    }
});

function openVideoLightbox() {
    sendVimeoCommand(videoPreviewPlayer, 'pause');
    setVimeoSource(videoLightboxPlayer, false);
    videoLightbox.classList.add('is-open');
    videoLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeVideoLightbox() {
    videoLightboxPlayer.removeAttribute('src');
    videoLightbox.classList.remove('is-open');
    videoLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    const selectedPreviewId = getResponsiveVideoId(videoPreviewPlayer);
    if (!videoPreviewPlayer.src.includes(`/video/${selectedPreviewId}?`)) {
        setVimeoSource(videoPreviewPlayer, true);
    } else {
        sendVimeoCommand(videoPreviewPlayer, 'play');
    }
}

videoPreview.addEventListener('click', openVideoLightbox);
videoLightboxClose.addEventListener('click', closeVideoLightbox);

videoLightbox.addEventListener('click', (event) => {
    if (event.target === videoLightbox) {
        closeVideoLightbox();
    }
});

// Управление с клавиатуры: Escape закрывает, стрелки листают
document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) {
        return;
    }

    if (event.key === 'Escape') {
        closeLightbox();
    } else if (event.key === 'ArrowLeft') {
        showPrev();
    } else if (event.key === 'ArrowRight') {
        showNext();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && videoLightbox.classList.contains('is-open')) {
        closeVideoLightbox();
    }
});

// ==================== МОДАЛКА: "ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ" ====================

const consultModal = document.getElementById('consultModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const consultForm = document.getElementById('consultForm');

// Все элементы, которые должны открывать эту модалку.
// Сейчас это кнопка "ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ" в CTA-секции — добавь ещё
// селекторов через запятую, если появятся другие кнопки с тем же смыслом.
const consultTriggers = document.querySelectorAll('.cta__button');

const modalSuccess = document.getElementById('modalSuccess');

function openModal() {
    consultModal.classList.add('is-open');
    consultModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Каждый раз при открытии показываем именно форму, а не прошлый экран успеха
    consultForm.style.display = '';
    modalSuccess.classList.remove('is-visible');
}

function closeModal() {
    consultModal.classList.remove('is-open');
    consultModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

consultTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault(); // отменяем переход по "#contacts" — вместо этого открываем форму
        openModal();
    });
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && consultModal.classList.contains('is-open')) {
        closeModal();
    }
});

// ==================== МАСКА ТЕЛЕФОНА +7 XXX XXX XX XX (модалка "Получить консультацию") ====================

const phoneInput = document.getElementById('phone');

// При заходе в пустое поле сразу подставляем "+7 " — дальше пользователь просто печатает цифры
phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) {
        phoneInput.value = '+7 ';
    }
});

// Если поле оставили пустым (стёрли всё, включая "+7 ") — очищаем совсем, а не оставляем "+7 " висеть
phoneInput.addEventListener('blur', () => {
    if (phoneInput.value.trim() === '+7') {
        phoneInput.value = '';
    }
});

phoneInput.addEventListener('input', () => {
    // Забираем только цифры из того, что ввёл пользователь
    let digits = phoneInput.value.replace(/\D/g, '');

    // Первая цифра всегда трактуется как код страны "7" (даже если человек начал с 8)
    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1);
    }
    if (!digits.startsWith('7')) {
        digits = '7' + digits;
    }

    // Код страны не считаем частью номера, дальше форматируем только то, что после него
    const rest = digits.slice(1, 11); // максимум 10 цифр номера

    let formatted = '+7';

    if (rest.length > 0) {
        formatted += ' ' + rest.slice(0, 3);   // код оператора: 777
    }
    if (rest.length > 3) {
        formatted += ' ' + rest.slice(3, 6);   // 777
    }
    if (rest.length > 6) {
        formatted += ' ' + rest.slice(6, 8);   // 77
    }
    if (rest.length > 8) {
        formatted += ' ' + rest.slice(8, 10);  // 77
    }

    phoneInput.value = formatted;
});

async function submitLead(form) {
    const formData = new FormData(form);
    formData.set('form_type', form.dataset.formType || 'unknown');
    const response = await fetch('api/submit.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Не удалось отправить заявку');
    }
}

function showFormError(form, message) {
    let error = form.querySelector('.form-error');

    if (!error) {
        error = document.createElement('p');
        error.className = 'form-error';
        form.append(error);
    }

    error.textContent = message;
}

consultForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = consultForm.querySelector('[type="submit"]');

    submitButton.disabled = true;

    try {
        await submitLead(consultForm);
        consultForm.style.display = 'none';
        modalSuccess.classList.add('is-visible');

        setTimeout(() => {
            closeModal();
            consultForm.reset();
        }, 3000);
    } catch (error) {
        showFormError(consultForm, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
    } finally {
        submitButton.disabled = false;
    }
});

// ==================== МОДАЛКА: "ОСТАВЬТЕ ЗАЯВКУ" (кнопки "ЗАКАЗАТЬ" в пакетах услуг) ====================

const orderModal = document.getElementById('orderModal');
const orderModalOverlay = document.getElementById('orderModalOverlay');
const orderModalClose = document.getElementById('orderModalClose');
const orderFinalBlock = document.getElementById('orderFinalBlock');
const orderForm = document.getElementById('orderForm');
const orderModalSuccess = document.getElementById('orderModalSuccess');
const orderTriggers = document.querySelectorAll('[data-open-order]');

let selectedPackage = '';

function openOrderModal(packageName) {
    selectedPackage = packageName || '';
    orderForm.querySelector('[name="package"]').value = selectedPackage;
    orderModal.classList.add('is-open');
    orderModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Каждый раз при открытии показываем именно форму, а не прошлый экран успеха
    orderFinalBlock.style.display = '';
    orderModalSuccess.classList.remove('is-visible');
}

function closeOrderModal() {
    orderModal.classList.remove('is-open');
    orderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

orderTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openOrderModal(trigger.dataset.package);
    });
});

orderModalClose.addEventListener('click', closeOrderModal);
orderModalOverlay.addEventListener('click', closeOrderModal);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && orderModal.classList.contains('is-open')) {
        closeOrderModal();
    }
});

// Маска телефона для поля заявки — та же логика, что и у квиза
const orderPhoneInput = document.querySelector('input[name="order_phone"]');

if (orderPhoneInput) {
    orderPhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Удаляем всё, кроме цифр

        if (value.startsWith('7') || value.startsWith('8')) {
            value = value.substring(1);
        }

        let formattedValue = '+7 ';
        if (value.length > 0) {
            formattedValue += '(' + value.substring(0, 3);
        }
        if (value.length >= 4) {
            formattedValue += ') ' + value.substring(3, 6);
        }
        if (value.length >= 7) {
            formattedValue += '-' + value.substring(6, 8);
        }
        if (value.length >= 9) {
            formattedValue += '-' + value.substring(8, 10);
        }

        e.target.value = formattedValue;
    });

    // Если пользователь кликает в пустое поле — сразу подставляем +7
    orderPhoneInput.addEventListener('focus', (e) => {
        if (!e.target.value) {
            e.target.value = '+7 ';
        }
    });
}

orderForm.insertAdjacentHTML('afterbegin', '<input type="hidden" name="package">');

orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = orderForm.querySelector('[type="submit"]');

    submitButton.disabled = true;

    try {
        await submitLead(orderForm);
        orderFinalBlock.style.display = 'none';
        orderModalSuccess.classList.add('is-visible');

        setTimeout(() => {
            closeOrderModal();
            orderForm.reset();
        }, 3000);
    } catch (error) {
        showFormError(orderForm, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
    } finally {
        submitButton.disabled = false;
    }
});

// ==================== КВИЗ "РАССЧИТАТЬ СТОИМОСТЬ" ====================

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('quizModal');
    const openBtns = document.querySelectorAll('[data-open-quiz]');
    const closeBtns = document.querySelectorAll('[data-close-quiz]');

    // Проверка наличия элементов в DOM
    if (!modal) {
        console.error('Ошибка: Модальное окно с id="quizModal" не найдено в HTML!');
        return;
    }

    if (openBtns.length === 0) {
        console.warn('Предупреждение: Кнопки с атрибутом data-open-quiz не найдены!');
    }

    // Логика квиза
    const steps = modal.querySelectorAll('.quiz-step');
    const prevBtn = document.getElementById('quizPrevBtn');
    const nextBtn = document.getElementById('quizNextBtn');
    const progressFill = document.getElementById('quizProgressFill');
    const progressPercent = document.getElementById('quizProgressPercent');
    const quizFooter = modal.querySelector('.quiz-modal__footer');
    const quizForm = document.getElementById('quizForm');
    const quizSuccess = document.getElementById('quizSuccess');

    let currentStep = 1;
    const totalSteps = steps.length - 1;

    function updateQuiz() {
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        const percent = Math.round(((currentStep - 1) / totalSteps) * 100);
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;

        if (prevBtn) prevBtn.disabled = currentStep === 1;

        if (currentStep > totalSteps) {
            if (quizFooter) quizFooter.style.display = 'none';
        } else {
            if (quizFooter) quizFooter.style.display = 'flex';
            checkStepSelection();
        }
    }

    function checkStepSelection() {
        const activeStepEl = modal.querySelector(`.quiz-step[data-step="${currentStep}"]`);
        if (!activeStepEl) return;
        const inputs = activeStepEl.querySelectorAll('input[type="radio"]');
        const isSelected = Array.from(inputs).some(i => i.checked);
        if (nextBtn) nextBtn.disabled = !isSelected;
    }

    // Открытие окна
    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // На случай, если кнопка — это ссылка <a>
            modal.classList.add('is-open');

            // Каждый раз при открытии показываем именно форму, а не прошлый экран успеха
            quizForm.style.display = '';
            quizSuccess.classList.remove('is-visible');
        });
    });

    // Закрытие окна
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('is-open');
        });
    });

    if (quizForm) {
        quizForm.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                checkStepSelection();
            }
        });

        quizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = quizForm.querySelector('[type="submit"]');

            submitButton.disabled = true;

            try {
                await submitLead(quizForm);
                quizForm.style.display = 'none';
                quizSuccess.classList.add('is-visible');

                setTimeout(() => {
                    modal.classList.remove('is-open');
                    quizForm.reset();
                    currentStep = 1;
                    updateQuiz();
                }, 3000);
            } catch (error) {
                showFormError(quizForm, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep <= totalSteps) {
                currentStep++;
                updateQuiz();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateQuiz();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const phoneInputQuiz = document.querySelector('input[name="user_phone"]');

    if (phoneInputQuiz) {
        phoneInputQuiz.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Удаляем всё, кроме цифр

            if (value.startsWith('7') || value.startsWith('8')) {
                value = value.substring(1);
            }

            let formattedValue = '+7 ';
            if (value.length > 0) {
                formattedValue += '(' + value.substring(0, 3);
            }
            if (value.length >= 4) {
                formattedValue += ') ' + value.substring(3, 6);
            }
            if (value.length >= 7) {
                formattedValue += '-' + value.substring(6, 8);
            }
            if (value.length >= 9) {
                formattedValue += '-' + value.substring(8, 10);
            }

            e.target.value = formattedValue;
        });

        // Если пользователь кликает в пустое поле — сразу подставляем +7
        phoneInputQuiz.addEventListener('focus', (e) => {
            if (!e.target.value) {
                e.target.value = '+7 ';
            }
        });
    }
});

// ==================== ПРОКРУТКА ЛОГОТИПОВ БРЕНДОВ (drag мышью на десктопе) ====================

const grid = document.querySelector('.partners__grid');

let isDragging = false;
let startX = 0;
let startScrollLeft = 0;

grid.addEventListener('pointerdown', (e) => {
    // Работает только для мыши — на тачскрине пусть работает нативный swipe/snap
    if (e.pointerType !== 'mouse') return;

    e.preventDefault(); // блокирует нативное выделение/драг, которое сбивает pointer capture
    isDragging = true;
    startX = e.clientX;
    startScrollLeft = grid.scrollLeft;

    grid.classList.add('is-dragging');
    grid.setPointerCapture(e.pointerId); // "приклеивает" события к элементу, даже если курсор уйдёт за его пределы
});

grid.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const delta = e.clientX - startX;
    grid.scrollLeft = startScrollLeft - delta;
});

function stopDragging() {
    isDragging = false;
    grid.classList.remove('is-dragging');
}

grid.addEventListener('pointerup', stopDragging);
grid.addEventListener('pointercancel', stopDragging);
grid.addEventListener('pointerleave', stopDragging);