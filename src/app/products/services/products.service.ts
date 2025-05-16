import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Gender,
  ProductsResponse,
} from '@products/interfaces/product.interface';
import { delay, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { Product } from '../interfaces/product.interface';
import { User } from '@auth/interfaces/auth-response.interface';
import { formatCurrency, formatDate } from '@angular/common';

const baseUrl = environment.baseUrl;

const emptyProduct: Product = {
  id: 'new',
  title: '',
  price: 0,
  description: '',
  slug: '',
  stock: 0,
  sizes: [],
  gender: Gender.Men,
  tags: [],
  images: [],
  user: {} as User,
};

interface Options {
  limit?: number;
  offset?: number;
  gender?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  private productsCache = new Map<string, ProductsResponse>();

  private productCache = new Map<string, Product>();

  getProducts(options: Options): Observable<ProductsResponse> {
    const { limit = 12, offset = 0, gender = '' } = options;

    const key = `${limit}-${offset}-${gender}`;
    if (this.productsCache.has(key)) {
      return of(this.productsCache.get(key)!);
    }
    return this.http
      .get<ProductsResponse>(`${baseUrl}/products`, {
        params: {
          limit: limit,
          offset: offset,
          gender: gender,
        },
      })
      .pipe(
        tap((resp) => console.log(resp)),
        tap((resp) => this.productsCache.set(key, resp))
      );
  }

  getProductById(id: string): Observable<Product> {
    if (id == 'new') {
      return of(emptyProduct);
    }

    if (this.productCache.has(id)) {
      return of(this.productCache.get(id)!);
    }
    return this.http.get<Product>(`${baseUrl}/products/${id}`).pipe(
      delay(2000),
      tap((resp) => this.productCache.set(id, resp))
    );
  }

  updateProduct(
    id: string,
    productLike: Partial<Product>,
    imageFileList?: FileList
  ): Observable<Product> {
    const currentImages = productLike.images ?? [];

    return this.uploadImages(imageFileList).pipe(
      map((imageNames) => ({
        ...productLike,
        images: [...currentImages, ...imageNames],
      })),
      switchMap((updatedProduct) =>
        this.http.patch<Product>(`${baseUrl}/products/${id}`, updatedProduct)
      ),
      tap((product) => this.updateProductCache(product))
    );

    // return this.http
    //   .patch<Product>(`${baseUrl}/products/${id}`, productLike)
    //   .pipe(tap((product) => this.updateProductCache(product)));
  }

  updateProductCache(producto: Product) {
    const productId = producto.id;
    this.productCache.set(productId, producto);

    this.productsCache.forEach((productResponse) => {
      productResponse.products = productResponse.products.map(
        (currentProduct) => {
          return currentProduct.id == productId ? producto : currentProduct;
        }
      );
    });
  }

  createProduct(
    productLike: Partial<Product>,
    imageFileList?: FileList
  ): Observable<Product> {
    return this.uploadImages(imageFileList).pipe(
      map((imageNames) => ({
        ...productLike,
        images: [...imageNames],
      })),
      switchMap((updatedProduct) =>
        this.http.post<Product>(`${baseUrl}/products`, updatedProduct)
      ),
      tap((product) => this.updateProductCache(product))
    );

    // return this.http
    //   .post<Product>(`${baseUrl}/products`, productLike)
    //   .pipe(tap((product) => this.updateProductCache(product)));
  }

  uploadImages(images?: FileList): Observable<string[]> {
    if (!images) return of([]);
    const uploadObservables = Array.from(images).map((imageFile) =>
      this.uploadImage(imageFile)
    );
    return forkJoin(uploadObservables).pipe(
      tap((imageNames) => console.log({ imageNames }))
    );
  }

  uploadImage(imageFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile);
    return this.http
      .post<{ fileName: string }>(`${baseUrl}/files/product`, formData)
      .pipe(map((resp) => resp.fileName));
  }
}
