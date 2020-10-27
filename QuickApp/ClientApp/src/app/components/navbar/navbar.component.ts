import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastaService, ToastData, ToastOptions } from 'ngx-toasta';
import { Permission } from 'src/app/models/permission.model';
import { AccountService } from 'src/app/services/account.service';
import { AlertCommand, AlertDialog, AlertService, DialogType, MessageSeverity } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { LoginComponent } from '../login/loginmodal/login.component';
const alertify: any = require('../../assets/scripts/alertify.js');


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @ViewChildren('loginModal,loginControl')
  modalLoginControls: QueryList<any>;

  loginModal: ModalDirective;
  loginControl: LoginComponent;

@Input() appTitle;
@Input() isUserLoggedIn;

newNotificationCount;
  dataLoadingConsecutiveFailures: number;
  notificationsLoadingSubscription: any;
  
  isAppLoaded: boolean;
  removePrebootScreen: boolean;
  shouldShowLoginModal: boolean;

  stickyToasties: number[] = [];

  notificationsTitle

  constructor(    
    private notificationService: NotificationService,
    private alertService: AlertService,
    public router: Router,
    private authService: AuthService,
    private accountService: AccountService,
    private toastaService: ToastaService,


    ) { }

  ngOnInit(): void {

    this.isUserLoggedIn = this.authService.isLoggedIn;

    // 0.5 extra sec to display preboot/loader information. Preboot screen is removed 0.5 sec later
    setTimeout(() => this.isAppLoaded = true, 500);
    setTimeout(() => this.removePrebootScreen = true, 1000);

    setTimeout(() => {
      if (this.isUserLoggedIn) {
        this.alertService.resetStickyMessage();

        // if (!this.authService.isSessionExpired)
        this.alertService.showMessage('Login', `Welcome back ${this.userName}!`, MessageSeverity.default);
        // else
        //    this.alertService.showStickyMessage("Session Expired", "Your Session has expired. Please log in again", MessageSeverity.warn);
      }
    }, 2000);


    this.alertService.getDialogEvent().subscribe(alert => this.showDialog(alert));
    this.alertService.getMessageEvent().subscribe(message => this.showToast(message));

    this.authService.reLoginDelegate = () => this.shouldShowLoginModal = true;

    this.authService.getLoginStatusEvent().subscribe(isLoggedIn => {
      this.isUserLoggedIn = isLoggedIn;


      if (this.isUserLoggedIn) {
        this.initNotificationsLoading();
      } else {
        this.unsubscribeNotifications();
      }

      setTimeout(() => {
        if (!this.isUserLoggedIn) {
          this.alertService.showMessage('Session Ended!', '', MessageSeverity.default);
        }
      }, 500);
    });

  }

  ngAfterViewInit() {

    this.modalLoginControls.changes.subscribe((controls: QueryList<any>) => {
      controls.forEach(control => {
        if (control) {
          if (control instanceof LoginComponent) {
            this.loginControl = control;
            this.loginControl.modalClosedCallback = () => this.loginModal.hide();
          } else {
            this.loginModal = control;
            this.loginModal.show();
          }
        }
      });
    });
  }


  ngOnDestroy() {
    this.unsubscribeNotifications();
  }

  onLoginModalShown() {
    this.alertService.showStickyMessage('Session Expired', 'Your Session has expired. Please log in again', MessageSeverity.info);
  }


  onLoginModalHidden() {
    this.alertService.resetStickyMessage();
    this.loginControl.reset();
    this.shouldShowLoginModal = false;

    if (this.authService.isSessionExpired) {
      this.alertService.showStickyMessage('Session Expired', 'Your Session has expired. Please log in again to renew your session', MessageSeverity.warn);
    }
  }


  onLoginModalHide() {
    this.alertService.resetStickyMessage();
  }


  markNotificationsAsRead() {

    const recentNotifications = this.notificationService.recentNotifications;

    if (recentNotifications.length) {
      this.notificationService.readUnreadNotification(recentNotifications.map(n => n.id), true)
        .subscribe(response => {
          for (const n of recentNotifications) {
            n.isRead = true;
          }

          this.newNotificationCount = recentNotifications.filter(n => !n.isRead).length;
        },
          error => {
            this.alertService.logError(error);
            this.alertService.showMessage('Notification Error', 'Marking read notifications failed', MessageSeverity.error);

          });
    }
  }

  initNotificationsLoading() {

    this.notificationsLoadingSubscription = this.notificationService.getNewNotificationsPeriodically()
      .subscribe(notifications => {
        this.dataLoadingConsecutiveFailures = 0;
        this.newNotificationCount = notifications.filter(n => !n.isRead).length;
      },
        error => {
          this.alertService.logError(error);

          if (this.dataLoadingConsecutiveFailures++ < 20) {
            setTimeout(() => this.initNotificationsLoading(), 5000);
          } else {
            this.alertService.showStickyMessage('Load Error', 'Loading new notifications from the server failed!', MessageSeverity.error);
          }
        });
  }

  private unsubscribeNotifications() {
    if (this.notificationsLoadingSubscription) {
      this.notificationsLoadingSubscription.unsubscribe();
    }
  }

  showDialog(dialog: AlertDialog) {

    alertify.set({
      labels: {
        ok: dialog.okLabel || 'OK',
        cancel: dialog.cancelLabel || 'Cancel'
      }
    });

    switch (dialog.type) {
      case DialogType.alert:
        alertify.alert(dialog.message);

        break;
      case DialogType.confirm:
        alertify
          .confirm(dialog.message, (e) => {
            if (e) {
              dialog.okCallback();
            } else {
              if (dialog.cancelCallback) {
                dialog.cancelCallback();
              }
            }
          });

        break;
      case DialogType.prompt:
        alertify
          .prompt(dialog.message, (e, val) => {
            if (e) {
              dialog.okCallback(val);
            } else {
              if (dialog.cancelCallback) {
                dialog.cancelCallback();
              }
            }
          }, dialog.defaultValue);

        break;
    }
  }

  showToast(alert: AlertCommand) {

    if (alert.operation === 'clear') {
      for (const id of this.stickyToasties.slice(0)) {
        this.toastaService.clear(id);
      }

      return;
    }

    const toastOptions: ToastOptions = {
      title: alert.message.summary,
      msg: alert.message.detail,
    };


    if (alert.operation === 'add_sticky') {
      toastOptions.timeout = 0;

      toastOptions.onAdd = (toast: ToastData) => {
        this.stickyToasties.push(toast.id);
      };

      toastOptions.onRemove = (toast: ToastData) => {
        const index = this.stickyToasties.indexOf(toast.id, 0);

        if (index > -1) {
          this.stickyToasties.splice(index, 1);
        }

        if (alert.onRemove) {
          alert.onRemove();
        }

        toast.onAdd = null;
        toast.onRemove = null;
      };
    } else {
      toastOptions.timeout = 4000;
    }


    switch (alert.message.severity) {
      case MessageSeverity.default: this.toastaService.default(toastOptions); break;
      case MessageSeverity.info: this.toastaService.info(toastOptions); break;
      case MessageSeverity.success: this.toastaService.success(toastOptions); break;
      case MessageSeverity.error: this.toastaService.error(toastOptions); break;
      case MessageSeverity.warn: this.toastaService.warning(toastOptions); break;
      case MessageSeverity.wait: this.toastaService.wait(toastOptions); break;
    }
  }

  

  get userName(): string {
    return this.authService.currentUser ? this.authService.currentUser.userName : '';
  }

  get fullName(): string {
    return this.authService.currentUser ? this.authService.currentUser.fullName : '';
  }



  get canViewCustomers() {
    return this.accountService.userHasPermission(Permission.viewUsersPermission); // eg. viewCustomersPermission
  }

  get canViewProducts() {
    return this.accountService.userHasPermission(Permission.viewUsersPermission); // eg. viewProductsPermission
  }

  get canViewOrders() {
    return true; // eg. viewOrdersPermission
  }
}
