import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { BehaviorSubject, debounceTime, map, Observable, of, startWith} from 'rxjs';


import {CommonModule, CurrencyPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTableModule, MatTableDataSource} from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';

import {
  MatSnackBar, 
  MatSnackBarModule,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition
} from '@angular/material/snack-bar';

import {MatChipsModule} from '@angular/material/chips';

import { btnTextDict } from './buttonsText';
import { ProductsService } from 'src/app/services/productsService/products.service';
import { SelectProductComponent } from '../products/select-product/select-product.component';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonProductComponent } from './common-product/common-product.component';
import { GranelSaleComponent } from './granel-sale/granel-sale.component';
import { columnsLong, columnsMedium, columnsSmall, columnLabel } from './table-columns';
import { SubmitBillComponent } from './submit-bill/submit-bill.component';
import { NewTicketComponent } from './new-ticket/new-ticket.component';
import { TicketService } from 'src/app/services/ticketService/ticket-service';
import { ModifyPriceComponent } from './modify-price/modify-price.component';
import { OpenDrawerComponent } from '../open-drawer/open-drawer.component';
import { Snackbar } from 'src/app/snack-bars/snackbar.component';
import { SalesRecordService } from 'src/app/services/salesRecord/sales-record.service';
import { IaOptionsComponent } from '../conner-ia-options/ia-options/ia-options.component';
import { QuickSaleComponent } from './quick-sale/quick-sale.component';
import { ModifyCantityComponent } from './modify-cantity/modify-cantity.component';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css'],
  standalone: true,
  imports: [MatTableModule, MatDialogModule, CommonModule, FormsModule, MatMenuModule, MatAutocompleteModule, ReactiveFormsModule, MatSnackBarModule, MatChipsModule],
})

export class BillComponent{
  btnTextDict = btnTextDict;
  deleteProdBtnText! :string;
  commontArtBtnText! :string;
  wholesaleBtnText! :string;
  collectBtnText!: string;
  newTicketText!: string;
  quickSaleText!: string;
  openDrawerText!: string;

  //Finded products
  inputSearch = new FormControl('');
  inputCode!: string;
  filteredProducts!: Observable<any[]>;
  products!: any;

  //Active ticket
  activeTicket!: any;
  total = 0.00;
  productsCount = 0;
  apliedDiscount = 0;
  TicketIndex: number = 0;
  avaliablePrinters!: string[];
  deletedTicketId!: number;

  //Previous ticket
  previousSubTotal!: number;
  previousProdCount!: number;
  previousTotal!: number;
  previousPrinter!: string; 
  previousFolio!: number;

  //Ticket table
  displayedColumns: string[] = columnsLong;
  displayedColumnsWithOptions: string[] = [...columnsLong, 'options'];
  
  columnLabel: any = columnLabel;

  displayLargeSearcgInput: boolean = false;

  //Products data
  dataSource = new MatTableDataSource<any>();
  productRow!: any;
  productRowIndex = 0;

  constructor(
    private productsService: ProductsService,
    private ticketService: TicketService,
    private modal : MatDialog,
    private _snackBar: MatSnackBar,
    public sales: SalesRecordService,
  ) {

    this.inputSearch.valueChanges.pipe(debounceTime(300)).subscribe({
      next: () =>{
        const search = this.inputSearch.value
        if(search){
          this.productsService.getProductNames(search).subscribe({
            next: (data) =>{
              this.products = data;
              this.filteredProducts = this.inputSearch.valueChanges.pipe(
                startWith(''),
                map(() => (this.products)),
              );
            }
          })
        }
          
      },
    });

    this.onResize();
    window.addEventListener('resize', this.onResize.bind(this));

    this.activeTicket = this.sales.getSaleByIndex();

    const total = this.activeTicket.products.total();
    this.productsCount = this.activeTicket.products.count();
    this.total = total;
    this.apliedDiscount = this.activeTicket.products.discount;
    this.activeTicket.total = total;
    this.dataSource.data = this.activeTicket.products.get();

    this.ticketService.registerLocalPrinters().subscribe({
      next: () => {
        this.ticketService.getPrinters().subscribe({
          next: (data) =>{
            this.avaliablePrinters = data;
          }
        })
      },
      error: (err) => console.error(err)
    })
    
  }

  //Screen events
  private screenWidth = new BehaviorSubject<number>(window.innerWidth);
  screenWidth$ = this.screenWidth.asObservable();

  @ViewChildren('tableRow') tableRows!: QueryList<ElementRef>;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9¡!¿?"-=,:;()@#$%^&*_~\[\]\{\} ]*$/;
    const key = event.key;    
    
    if(this.modal.openDialogs.length === 0){
      switch (true) {
        case key === 'ArrowDown' && document.activeElement != document.getElementById('search-input'):
          this.nextProduct();
          break;
          
        case key === 'ArrowUp' && document.activeElement != document.getElementById('search-input'):
          this.previousProduct();
          break;
        
        case key === '+':
          event.preventDefault()
          if(this.productRow) this.addProduct(this.productRow);
          break;
        
        case key === '-':
          event.preventDefault()
          if(this.productRow) this.removeProduct(1);
          break;
  
        case key === 'Delete':
          this.removeProduct();
          break;

        case key === 'F1' || key === 'F3' || key === 'F4':
          event.preventDefault();
          break;

        case key === 'F5':
          event.preventDefault();
          this.nextTicket();
          break;

        case key === 'F6':
          event.preventDefault();
          this.createNewTicket();
          break;

        case key === 'F7':
          event.preventDefault();
          this.quickSale();
          break;

        case key === 'F10':
          document.getElementById('search-input')?.focus();
          document.getElementById('search-input')?.click();
          event.preventDefault();
          break;
        
        case key === 'F11':
          event.preventDefault();
          this.wholesale();
          break;

        case key === 'F12':
          event.preventDefault();
          this.checkBill();
          break;
  
        case event.ctrlKey && key.toLowerCase() === 'p':
          event.preventDefault();
          this.newCommonProduct();
          break;
          
        case key.length === 1:
          event.preventDefault();
          document.getElementById('search-input')?.focus()
          document.getElementById('search-input')?.click();

          if(regex.test(key)){
            var value = this.inputSearch.value;
            this.inputSearch.setValue(value += key);
          }
          break;
      }
    }
  }

  private changeTextsandTable(text:'long' | 'medium' | 'small', table:'long' | 'medium' | 'small'){
    this.deleteProdBtnText = this.btnTextDict.delete[text];
    this.commontArtBtnText = this.btnTextDict.common[text];
    this.wholesaleBtnText = this.btnTextDict.wholesale[text];
    this.collectBtnText = this.btnTextDict.collect[text];
    this.newTicketText = this.btnTextDict.newTicket[text];
    this.quickSaleText = this.btnTextDict.quickSale[text];
    this.openDrawerText = this.btnTextDict.openDrawer[text];

    switch (table){
      case 'long':
        this.displayedColumnsWithOptions = [...columnsLong, 'options'];
        break
      case 'medium':
        this.displayedColumnsWithOptions = [...columnsMedium, 'options'];
        break
      case 'small':
        this.displayedColumnsWithOptions = [...columnsSmall, 'options'];
        break
    }
 
  }

  private onResize(){
    if(window.innerWidth > 1600){
      this.changeTextsandTable('long', 'long');
    }
    else if(window.innerWidth <= 1600 && window.innerWidth > 1200){ 
      this.changeTextsandTable('medium', 'long');
    }
    else if(window.innerWidth <= 1200 && window.innerWidth >= 668){
      this.changeTextsandTable('medium', 'medium');
    }
    else{
      this.changeTextsandTable('small', 'small');
    }
  }

  blurInput(): void{
    document.getElementById('search-input')?.blur();
    this.filteredProducts = of([]);
    this.products = null;
    this.display_large_search(false);
  }

  resetInput(): void{
    this.inputSearch.setValue('');
    this.products = null;
    setTimeout(()=>{
      this.filteredProducts = of([]);
    }, 200);
    this.display_large_search(false);
  }

  addProduct(product: any, cantity?: any): void{
    const appendedProduct = cantity ? this.activeTicket.products.add(product,cantity) : this.activeTicket.products.add(product);
    this.selectProduct(appendedProduct);
  }

  removeProduct(remove: number = 0): void{
    if(remove > 0){
      if(this.productRow.cantity - remove <= 0){
        this.activeTicket.products.remove(this.productRow, remove);
        if(this.productRowIndex === 0){
          this.productRowIndex--;
          this.nextProduct();
        } 
        else this.previousProduct();
        return
      }

      this.activeTicket.products.remove(this.productRow, remove);
      this.getProducts();
      
    }else{
      this.activeTicket.products.remove(this.productRow, remove);
          
      if(this.productRowIndex === 0){
        this.productRowIndex--;
        this.nextProduct();
      } 
      else this.previousProduct();

      this.infoBar('¡Eliminado de la cuenta!', 'warning');
    }
  }

  wholesale(): void{
    if(this.activeTicket.products.wholesale){
      this.activeTicket.products.undoWholesale();
      this.infoBar('¡Mayoreo eliminado!', 'warning');
    }
    else{
      this.activeTicket.products.applyWholesale();
      this.infoBar('¡Mayoreo aplicado!', 'info');
    }
    this.getProducts();
  }

  getProducts(): any{
    const total = this.activeTicket.products.total();
    this.productsCount = this.activeTicket.products.count();
    this.total = total;
    this.apliedDiscount = this.activeTicket.products.discount;
    this.activeTicket.total = total;
    this.dataSource.data = this.activeTicket.products.get();
    return this.activeTicket.products.get();
  }

  quickSearch(prodCode: any): void{
    this.inputSearch.setValue(prodCode);
    this.searchProduct();
  }

  searchProduct(){
    var findedProducts: any;
    this.filteredProducts = of([]);
    if(this.inputSearch.value){
      this.inputCode = this.inputSearch.value;
      this.productsService.getProduct(this.inputSearch.value).subscribe({
        next: (data) => findedProducts = data,
        error: () => this.infoBar('¡No hay coincidencias con el producto!', 'error'),
        complete: () => this.processFindedProduct(findedProducts)
      });
    }

    this.blurInput();
  }

  processFindedProduct(findedProducts: any){
      if(findedProducts.length === 1 && findedProducts[0].code){
        if(findedProducts[0].code === this.inputCode) findedProducts[0].saleType != 'D' ? this.addProduct(findedProducts[0]): this.grannelProduct(findedProducts[0]);
        else this.openFindedModal(findedProducts);
      }else{
        this.openFindedModal(findedProducts);
      }

      this.blurInput();
    }
  
    //MODALS
  openFindedModal(products: any): void{
    const modalRef = this.modal.open(SelectProductComponent,{
      width: '70%',
      height: '80%',
      data: { products: products}
    });

    modalRef.afterClosed().subscribe(product => {
      if(product) product.saleType != 'D' ? this.addProduct(product): this.grannelProduct(product);
    });
  }

  // Common product sale
  newCommonProduct(): void{
    const modalRef = this.modal.open(CommonProductComponent,{
      width: '500px',
      height: '360px',
    });

    modalRef.afterClosed().subscribe(product => {
      if(product) this.addProduct(product, product?.cantity);
    });
  }

  openDrawer(): void{
    this.modal.open(OpenDrawerComponent);
  }

  quickSale(): void{
    const modalRef = this.modal.open(QuickSaleComponent);

    modalRef.afterClosed().subscribe(request => {
      if(request){
        this.previousTotal = request.paidWith;
        this.previousPrinter = request.printerName;
        this.previousFolio = request.folio;
        this.previousSubTotal = request.paidWith;
        this.previousProdCount = 1;

        this.getProducts();

        this.infoBar('¡Venta registrada!', 'success');
      }
    });
  }

  grannelProduct(product: any): void{
    const modalRef = this.modal.open(GranelSaleComponent,{
      width: '500px',
      height: '330px',
      data: {product: product}
    });

    modalRef.afterClosed().subscribe(product => {
      if(product) this.addProduct(product, product?.cantity);
    });
  }

  checkBill(): void{
    if(this.total){
      const productsRecord = this.getProducts();

      const modalRef = this.modal.open(SubmitBillComponent,{
        width: '578px',
        height: '500px',
        data: { 
          ticket: {
            total: this.total,
            products: productsRecord,
            wholesale: this.apliedDiscount,
            productsCount: this.productsCount,
          },
          printers: this.avaliablePrinters
        }
      });
  
      modalRef.afterClosed().subscribe(request => {
        if(request){
          this.previousTotal = request.paidWith;
          this.previousPrinter = request.printerName;
          this.previousFolio = request.folio;
          this.previousSubTotal = this.activeTicket.products.total();
          this.previousProdCount = this.activeTicket.products.count();
          
          this.sales.resetSale(this.TicketIndex);
          this.TicketIndex = 0;
          this.activeTicket = this.sales.getSaleByIndex();

          this.getProducts();

          this.infoBar('¡Venta registrada!', 'success');
        }
      });
    }else{
      this.infoBar('¡Agregue elementos a la cuenta!', 'error');
    }
  }

  createNewTicket(): void{
    const modalRef = this.modal.open(NewTicketComponent,{
      width: '500px',
      height: '230px',
    });

    modalRef.afterClosed().subscribe(name => {
      if(name){
        this.sales.addSale(name);

        this.TicketIndex = this.sales.countSales() - 1;

        this.changeTicket(this.TicketIndex);
      };
    });
  }

  deleteTicket(){
    this.sales.deleteSale(this.deletedTicketId);
    this.changeTicket(0);
  }

  modifyProductPrice(product: any): void{
    const modalRef = this.modal.open(ModifyPriceComponent,{
      width: '500px',
      height: '350px',
      data: {
        product: product
      }
    });

    modalRef.afterClosed().subscribe(newProd => {
      this.activeTicket.products.update(newProd);
      this.getProducts();
    });
  }

  modifyProductCantity(product: any): void{
    const modalRef = this.modal.open(ModifyCantityComponent,{
      width: '450px',
      height: '300px',
      data: {
        product: product
      }
    });

    modalRef.afterClosed().subscribe(newProd => {
      this.activeTicket.products.update(newProd);
      this.getProducts();
    });
  }

  //Table events
  changeTicket(ticketId: number): void{
    this.TicketIndex = ticketId;
    if(ticketId > -1){
      this.activeTicket = this.sales.getSaleByIndex(ticketId);
      const products = this.getProducts();
      this.productRow = products[products.length - 1];
      this.productRowIndex = products.length - 1;
      this.infoBar(`Se ha cambiado a la cuenta: ${this.activeTicket.ticketName}`, 'success');
    }else{
      this.createNewTicket();
    }
  }

  nextTicket(): void{
    if(this.TicketIndex < this.sales.countSales() - 1){
      this.TicketIndex++;
      this.changeTicket(this.TicketIndex);
    }else{
      this.TicketIndex = 0;
      this.changeTicket(this.TicketIndex);
    }
  }

  selectProduct(row: any) {
    const products = this.getProducts();
    this.productRowIndex = products.findIndex((obj: any) => row == obj);
    this.productRow = row;
    setTimeout(() => {
      this.scrollIntoView(`row${row.code}`);
    }, 250);
    
  }

  scrollIntoView(code: any): void{
    document.getElementById(code)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }

  nextProduct(): void{
    const products = this.getProducts();
    if(this.productRowIndex < products.length - 1) this.selectProduct(products[this.productRowIndex + 1]);
  }

  previousProduct(): void{
    const products = this.getProducts();
    if(this.productRowIndex > 0) this.selectProduct(products[this.productRowIndex - 1]);
  }

  printPreviousTicket(): void{
    console.log('Hola lola')
    this.ticketService.printTicketById({
      ID: this.previousFolio,
      printerName: this.previousPrinter 
    }).subscribe({
      next: () => this.infoBar(`Ticket °${this.previousFolio}`, 'success'),
      error: () => this.infoBar(`Problemas al imprimir el ticket`, 'error')
    })
  }

  openIaModal(){
    const modalRef = this.modal.open(IaOptionsComponent,{
      minWidth: '300px',
      minHeight: '300px',
      maxWidth: '400px',
      data: {ticket: this.activeTicket}
    });

    modalRef.afterClosed().subscribe(name => {
      if(name){
        this.sales.addSale(name);

        this.TicketIndex = this.sales.countSales() - 1;

        this.changeTicket(this.TicketIndex);
      };
    });
  }

  durationInSeconds = 3;
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  infoBar(message: string, className: 'success' | 'error' | 'info' | 'warning') {
    this._snackBar.openFromComponent(Snackbar, {
      duration: this.durationInSeconds * 1000,
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      data: { 
        message: message, 
        class: className 
      },
    });
  }

  test(receipt: number){
    //todo
    if(window.innerWidth > 992){
      this.displayLargeSearcgInput = true;
    }
  }

  display_large_search(set: boolean){
    if(window.innerWidth > 992){
      if(set){
        this.displayLargeSearcgInput = true;
        
        this.deleteProdBtnText = this.btnTextDict.delete['small'];
        this.commontArtBtnText = this.btnTextDict.common['small'];
        this.wholesaleBtnText = this.btnTextDict.wholesale['small'];
        this.newTicketText = this.btnTextDict.newTicket['small'];
        this.quickSaleText = this.btnTextDict.quickSale['small'];
        this.openDrawerText = this.btnTextDict.openDrawer['small'];
      }else{
        this.displayLargeSearcgInput = false;
        this.onResize();
      }
    }

  }


  
}
