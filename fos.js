// вывод текущего года в футере

    const year = new Date().getFullYear();
    document.getElementById('footerCopyrightYear').textContent = 
        `© ${year} Parametr`;

	// custom form with custom popup
    {
        const getUtms = () => {
            const utms = {};
            const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
            const urlParams = new URLSearchParams(window.location.search);

            urlParams.forEach((value, key) => {
                if (keys.includes(key)) {
                    utms[key] = value;
                }
            });

            // the condition is met if the URL contains utms
            if (Object.keys(utms).length > 0) {
                return {
                    utms,
                    from_url: true
                };
            }

            const now = new Date();
            const utmsData = localStorage.getItem('utms');
            const savedUtms = utmsData ? JSON.parse(utmsData) : null;

            if (savedUtms && savedUtms.expiry > now.getTime()) {
                Object.keys(savedUtms).forEach((key) => {
                    if (keys.includes(key)) {
                        utms[key] = savedUtms[key];
                    }
                });

                return {
                    utms: utms,
                    from_url: false
                };
            }

            return null;
        };

        const setUtms = (form) => {
            const utmsData = getUtms();

            if (utmsData) {
                const utms = utmsData.utms;

                if (utmsData.from_url) {
                    const expiryDate = new Date();
                    expiryDate.setMonth(expiryDate.getMonth() + 1); // expiry 30 days

                    const obj = {
                        expiry: expiryDate.getTime(),
                        ...utms
                    };

                    localStorage.setItem('utms', JSON.stringify(obj));
                }

                Object.keys(utms).forEach((key) => {
                    const value = utms[key];
                    const utmField = form.querySelector(`input[name="${key}"]`);

                    if (utmField) {
                        utmField.setAttribute('value', value);
                    }
                })
            }
        };

        const getYandexClientId = () => {
            const getClientId = () => {
                if (window.Ya && (window.Ya.Metrika2 || window.Ya.Metrika)) {
                    let clientId = '0';
                    let counterId = 0;
                    const yandexMetrika = window.Ya.Metrika2 || window.Ya.Metrika;
                    const counters = yandexMetrika.counters();
    
                    if (Array.isArray(counters) && counters.length >= 1) {
                        counterId = counters[0].id || 0;
                    }
    
                    if (window[`yaCounter${counterId}`]) {
                        clientId = window[`yaCounter${counterId}`].getClientID() || '0';
                    }
    
                    return {
                        clientId: clientId
                    };
                }
    
                return null;
            };
    
            return new Promise((resolve) => {
                // stop loop executed infinity times
                const timerId = setTimeout(() => {
                    resolve({
                        clientId: '0'
                    });
                }, 30000);
    
                const reCall = () => {
                    const result = getClientId();
    
                    if (result === null) {
                        setTimeout(() => {
                            reCall();
                        }, 400);
                    } else {
                        clearTimeout(timerId);
    
                        resolve({
                            clientId: result.clientId,
                        });
                    }
                };
    
                reCall();
            });
        };
        
        const setClientId = (form) => {
            getYandexClientId().then((res) => {
                const clientId = res.clientId;
                const clientIdField = form.querySelector(`input[name="cid"]`);
                
                if (clientIdField) {
                    clientIdField.setAttribute('value', clientId);
                }
            });
        };
        
        const getCalltouchSessionId = () => {
            const ctModId = 'jf63bn1d';
            const getSessionId = () => {
                if (window.ct && window.ct('calltracking_params', ctModId)?.sessionId) {
                    return {
                        sessionId: window.ct('calltracking_params', ctModId).sessionId
                    };
                }
    
                return null;
            };
    
            return new Promise((resolve) => {
                // stop loop executed infinity times
                const timerId = setTimeout(() => {
                    resolve({
                        sessionId: null
                    });
                }, 30000);
    
                const reCall = () => {
                    const result = getSessionId();
    
                    if (result === null) {
                        setTimeout(() => {
                            reCall();
                        }, 400);
                    } else {
                        clearTimeout(timerId);
    
                        resolve({
                            sessionId: result.sessionId,
                        });
                    }
                };
    
                reCall();
            });
        };
        
        const setCalltouchData = (form) => {
            const hostname = form.querySelector(`input[name="hostname"]`);
            const requestUrl = form.querySelector(`input[name="request_url"]`);
            
            if (hostname && requestUrl) {
                hostname.setAttribute('value', location.hostname);
                requestUrl.setAttribute('value', location.href);
            }
            
            const ctSessionId = form.querySelector(`input[name="ct_session_id"]`);
            
            if (ctSessionId) {
                getCalltouchSessionId().then((res) => {
                    const sessionId = res.sessionId;
                    
                    if (sessionId) {
                        ctSessionId.setAttribute('value', sessionId);
                    }
                });
            }
        };
        
        const renderPopup = (text) => {
            const template = `
                <div class="custom-success-popup js-custom-success-popup"> <div class="custom-success-popup__content"> <div class="custom-success-popup__close js-custom-success-popup__close"></div> <div class="custom-success-popup__title">Обратная связь</div> <div class="custom-success-popup__text">${text}</div> </div> </div>
            `;

            const scrollbarWidth = `${window.innerWidth - document.documentElement.clientWidth}px`;

            document.body.insertAdjacentHTML('beforeend', template);
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = scrollbarWidth;
        };

        const removePopup = () => {
            const popup = document.querySelector('.js-custom-success-popup');

            if (popup) {
                popup.remove();
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        };

		const customForms = document.querySelectorAll('.js-custom-form__form');
		
		Array.from(customForms).forEach((form) => {
			const inputs = form.querySelectorAll('.js-custom-form__input');
			const errors = form.querySelectorAll('.js-custom-form__error');
			const submitBtn = form.querySelector('.js-custom-form__btn');

			if (form && inputs.length > 0 && errors.length > 0 && submitBtn) {
				const clearErrors = () => {
					errors.forEach((error) => {
						const parent  = error.closest('.js-custom-form__field');
						parent.classList.remove('invalid');
						error.textContent = '';
					});
				};

				const addErrorToField = (field) => {
					const parent = field.closest('.js-custom-form__field');
					const error = parent.querySelector('.js-custom-form__error');
					parent.classList.add('invalid');
					
					let errorText = '';

					if (field.value === '' || (field.type === 'checkbox' && field.checked === false)) {
						errorText = field.getAttribute('data-error-required');
					} else {
						errorText = field.getAttribute('data-error-pattern');
					}

					error.textContent = errorText;
				};
				
				setUtms(form);
				setClientId(form);
				setCalltouchData(form);

				form.addEventListener('submit', async (event) => {
					event.preventDefault();
					
					if (form.checkValidity()) {
						clearErrors(); // удаляем старые ошибки
						submitBtn.classList.add('custom-form__btn_sending');
						submitBtn.setAttribute('disabled', true);
						
						const formData = new FormData(event.target);
                        const urlParams = new URLSearchParams();
        
                        for (const [key, value] of formData) {
                          urlParams.append(key, value);
                        }
						
						try {
							const response = await fetch('https://senkino-prom.ru/handler-forms/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                                },
                                body: urlParams
                            });
                            
                            const result = await response.json();

                            // if success
                            if (result?.status === 'ok') {
                                form.reset();
                                submitBtn.classList.remove('custom-form__btn_sending');
                                submitBtn.removeAttribute('disabled');
                                renderPopup('Спасибо! Ваш запрос отправлен.');
                            } else {
                                submitBtn.classList.remove('custom-form__btn_sending');
                                submitBtn.removeAttribute('disabled');
                                renderPopup('Не удалось отправить форму проверьте правильность вода и попытайтесь еще раз');
                            }
						} catch(error) {
							console.error(error);
							submitBtn.classList.remove('custom-form__btn_sending');
							submitBtn.removeAttribute('disabled');
							renderPopup('Не удалось отправить форму повторите пожалуйста попытку еще раз');
						}
					} else {
						clearErrors(); // удаляем старые ошибки

						Array.from(inputs).forEach((input) => {
							if (!input.validity.valid) {
								addErrorToField(input); // добавляем информацию об ошибке к полю
							}
						});
					}
				});
			}
		});

        // closing of popup
        document.addEventListener('click', (e) => {
            const target = e.target;
            const closePopupByClassNames = ['js-custom-success-popup', 'js-custom-success-popup__close'];

            if (closePopupByClassNames.some(className => target.classList.contains(className))) {
                removePopup();
            }
        });
    }
    // end