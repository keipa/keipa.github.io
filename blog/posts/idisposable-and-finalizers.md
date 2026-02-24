# IDisposable and Finalizers: difference and usage

This is topic around Garbage collector in scope of .Net platform. 
As far as garbage collector is automatic, it's not ideal. It's tracks managed resources only. Unmanaged resources have to be disposed by user code. 
However Microsoft provides a pattern that allows manage memory resources from users code. If user implement IDisposable interface - user can control the moment when the resource is not used and free it by calling `Dispose()` method.

However finilizer is doing similar thing, but during GC run after placing the object into the queue which is not as effective as IDisposable and if finilizer written well it's also freeing unmaneged resources. Finalizers is the safety net for freeing unmanaged data which is required for implementation (if unmanaged resources exist and freeing code is implemented) however CG will free memory in case if number of objects reference is equal to zero. It's important to mention that GC is not counting references, but mark those which are reachable from the whole scope and after marking unmarked group is the one which zero references.
`Dispose()` is called manually by running Dispose method or by ending of the using keyword, which is even more effective.
Finalizer is called by GC. We can't control when GC is called!

> **_IMPORTANT:_**  Developer should **not** rely on GC. All user classes **HAVE** to implement IDisposable if they are working with disposable objects or unmanaged resources and correctly call `Dispose()` when the object's resource is not required anymore!

When exactly we have to implement IDisposable:
- Your class required IDisposable in case if it's OWNS (not contains) IDisposable elements. Caller classes might give you their resources which you might not need to manage in your class.
- Your class required IDisposable in case if it's parent is child of IDisposable.

Always make sure that Dispose is called, wrap init with `try-finally` or use `using` keyword to guarantee resource freeing.

`Dispose()` is called in the runtime thread, finalizer is called in a special dotnet finalizer shared thread.

IDisposable and Finalizer have similar goal but there is a big difference of how and when is resource dealloaction happens. IDisposable allows you controlling the moment and method of dealloaction, but Finalizer is smth out of user's code control.

Good example of correct imlementation of Dispose and Finalize:
```csharp

namespace Example.Basic_Dispose_Pattern
{
    using System;
    using System.Diagnostics;
    using System.Drawing;

    public class BitmapImage : IDisposable
    {
        private bool disposed;
        private readonly Bitmap image;

        public BitmapImage(Bitmap image)
        {
            this.image = image;
        }

        public int ReadData()
        {
            // You do not need to throw ObjectDisposedException manually
            // if the underlying object is going to throw it anyway.
            ObjectDisposedException.ThrowIf(disposed, this); 

            return image.ReadByte(); 
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {           
            if (disposed)
            {
                return;
            }

            if (disposing)
            {
                image.Dispose();
                //dispose your managed resources there
            }
            //dispose your unmanaged resources there
            disposed = true;
        }

        ~BitmapImage()
        {
            Dispose(false);
        }
    }
}
```


Correct Usage:

```csharp
    try
    {
        image = new BitmapImage(bitmapImage);
    }
    finally
    {
        image?.Dispose();
    }
```


Usage with scope:

```csharp
    using (BitmapImage image = new BitmapImage(bitmapImage))
    {
        // do your work with object
    }
```

Simplified Usage:

```csharp
    using BitmapImage image = new BitmapImage(bitmapImage)
```

Good sources:
- David Anderson
- Eugeni Popov
- Eric Holland
